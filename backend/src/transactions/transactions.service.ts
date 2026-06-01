import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  formatDateOnly,
  getUtcCalendarMonthRange,
  getUtcDayRange,
  parseDateOnly,
} from '../common/date/date-only';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateTransactionDto,
  GetTransactionsQueryDto,
  TransactionDateRangeOptionDto,
  TransactionDateRangesDto,
  TransactionItemDto,
  TransactionsListDto,
} from './transactions.dto';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const transactionListSelect = Prisma.validator<Prisma.TransactionSelect>()({
  id: true,
  name: true,
  email: true,
  product: true,
  quantity: true,
  totalCents: true,
});

const transactionDateRangeSelect =
  Prisma.validator<Prisma.TransactionDateRangeSelect>()({
    id: true,
    startsAt: true,
    endsAt: true,
  });

type TransactionListRecord = Prisma.TransactionGetPayload<{
  select: typeof transactionListSelect;
}>;

type TransactionDateRangeRecord = Prisma.TransactionDateRangeGetPayload<{
  select: typeof transactionDateRangeSelect;
}>;

function formatTransaction(
  transaction: TransactionListRecord,
): TransactionItemDto {
  return {
    id: transaction.id,
    name: transaction.name,
    email: transaction.email,
    product: transaction.product,
    quantity: `${transaction.quantity.toLocaleString('en-US')} pcs`,
    total: currencyFormatter.format(transaction.totalCents / 100),
  };
}

function formatDateRange(
  dateRange: TransactionDateRangeRecord,
): TransactionDateRangeOptionDto {
  return {
    value: dateRange.id,
    from: formatDateOnly(dateRange.startsAt),
    to: formatDateOnly(dateRange.endsAt),
  };
}

function getTransactionDateRange(
  from?: string,
  to?: string,
): Pick<Prisma.TransactionWhereInput, 'date'> {
  if (!from && !to) {
    return {};
  }

  const fromDate = from ? parseDateOnly(from) : null;
  const toDateRange = to ? getUtcDayRange(to) : null;

  if (fromDate && toDateRange && fromDate >= toDateRange.endsBefore) {
    throw new BadRequestException(
      'From date must be less than or equal to to date',
    );
  }

  return {
    date: {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDateRange ? { lt: toDateRange.endsBefore } : {}),
    },
  };
}

function getNumberRange(
  min: number | undefined,
  max: number | undefined,
  fieldLabel: string,
): Prisma.IntFilter | undefined {
  if (min !== undefined && max !== undefined && min > max) {
    throw new BadRequestException(
      `${fieldLabel} minimum must be less than or equal to maximum`,
    );
  }

  if (min === undefined && max === undefined) {
    return undefined;
  }

  return {
    ...(min !== undefined ? { gte: min } : {}),
    ...(max !== undefined ? { lte: max } : {}),
  };
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDateRanges(userId: string): Promise<TransactionDateRangesDto> {
    const items = await this.prisma.transactionDateRange.findMany({
      where: { userId },
      orderBy: { startsAt: 'desc' },
      select: transactionDateRangeSelect,
    });

    return {
      items: items.map(formatDateRange),
    };
  }

  async getTransactions(
    userId: string,
    {
      page,
      limit,
      search,
      from,
      to,
      product,
      minQuantity,
      maxQuantity,
      minTotalCents,
      maxTotalCents,
    }: GetTransactionsQueryDto,
  ): Promise<TransactionsListDto> {
    const skip = (page - 1) * limit;
    const quantity = getNumberRange(minQuantity, maxQuantity, 'Quantity');
    const totalCents = getNumberRange(minTotalCents, maxTotalCents, 'Total');
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...getTransactionDateRange(from, to),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { product: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(product
        ? { product: { contains: product, mode: 'insensitive' } }
        : {}),
      ...(quantity ? { quantity } : {}),
      ...(totalCents ? { totalCents } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        select: transactionListSelect,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map(formatTransaction),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async createTransaction(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionItemDto> {
    const date = parseDateOnly(dto.date);
    const { startsAt, endsAt } = getUtcCalendarMonthRange(dto.date);

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId,
          name: dto.name,
          email: dto.email,
          product: dto.product,
          quantity: dto.quantity,
          totalCents: dto.totalCents,
          date,
        },
        select: transactionListSelect,
      }),
      this.prisma.transactionDateRange.upsert({
        where: {
          userId_startsAt_endsAt: {
            userId,
            startsAt,
            endsAt,
          },
        },
        create: {
          userId,
          startsAt,
          endsAt,
        },
        update: {},
      }),
    ]);

    return formatTransaction(transaction);
  }
}
