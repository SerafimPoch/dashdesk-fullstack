import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaService } from '../../prisma/prisma.service';
import type { CreateTransactionDto } from '../transactions.dto';
import { GetTransactionsQueryDto } from '../transactions.dto';
import { TransactionsService } from '../transactions.service';

type PrismaMock = {
  transaction: {
    findMany: ReturnType<typeof jest.fn>;
    count: ReturnType<typeof jest.fn>;
    create: ReturnType<typeof jest.fn>;
  };
  transactionDateRange: {
    findMany: ReturnType<typeof jest.fn>;
    upsert: ReturnType<typeof jest.fn>;
  };
  $transaction: ReturnType<typeof jest.fn>;
};

function createPrismaMock(): PrismaMock {
  return {
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    transactionDateRange: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    ),
  };
}

function createService() {
  const prisma = createPrismaMock();
  const service = new TransactionsService(prisma as unknown as PrismaService);

  return { prisma, service };
}

function createQuery(
  overrides: Partial<GetTransactionsQueryDto> = {},
): GetTransactionsQueryDto {
  return Object.assign(new GetTransactionsQueryDto(), overrides);
}

describe('TransactionsService', () => {
  describe('getDateRanges', () => {
    it('returns date ranges formatted as date-only options', async () => {
      const { prisma, service } = createService();

      prisma.transactionDateRange.findMany.mockResolvedValue([
        {
          id: 'range-1',
          startsAt: new Date('2026-05-01T00:00:00.000Z'),
          endsAt: new Date('2026-05-31T00:00:00.000Z'),
        },
      ]);

      await expect(service.getDateRanges('user-1')).resolves.toEqual({
        items: [
          {
            value: 'range-1',
            from: '2026-05-01',
            to: '2026-05-31',
          },
        ],
      });

      expect(prisma.transactionDateRange.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { startsAt: 'desc' },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
        },
      });
    });
  });

  describe('getTransactions', () => {
    it('returns formatted transactions with pagination metadata', async () => {
      const { prisma, service } = createService();

      prisma.transaction.findMany.mockResolvedValue([
        {
          id: 'transaction-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          product: 'Dashdesk Pro',
          quantity: 3000,
          totalCents: 12000,
        },
      ]);
      prisma.transaction.count.mockResolvedValue(3);

      await expect(
        service.getTransactions('user-1', createQuery({ page: 2, limit: 2 })),
      ).resolves.toEqual({
        items: [
          {
            id: 'transaction-1',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            product: 'Dashdesk Pro',
            quantity: '3,000 pcs',
            total: '$120',
          },
        ],
        meta: {
          page: 2,
          limit: 2,
          total: 3,
          totalPages: 2,
        },
      });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        skip: 2,
        take: 2,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          email: true,
          product: true,
          quantity: true,
          totalCents: true,
        },
      });
      expect(prisma.transaction.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('builds search, date, product, quantity, and total filters', async () => {
      const { prisma, service } = createService();

      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await expect(
        service.getTransactions(
          'user-1',
          createQuery({
            search: 'ada',
            from: '2026-05-01',
            to: '2026-05-31',
            product: 'pro',
            minQuantity: 2,
            maxQuantity: 10,
            minTotalCents: 500,
            maxTotalCents: 15000,
          }),
        ),
      ).resolves.toEqual({
        items: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        },
      });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            date: {
              gte: new Date('2026-05-01T00:00:00.000Z'),
              lt: new Date('2026-06-01T00:00:00.000Z'),
            },
            OR: [
              { name: { contains: 'ada', mode: 'insensitive' } },
              { email: { contains: 'ada', mode: 'insensitive' } },
              { product: { contains: 'ada', mode: 'insensitive' } },
            ],
            product: { contains: 'pro', mode: 'insensitive' },
            quantity: { gte: 2, lte: 10 },
            totalCents: { gte: 500, lte: 15000 },
          },
        }),
      );
    });

    it('builds an open-ended from date filter', async () => {
      const { prisma, service } = createService();

      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await service.getTransactions(
        'user-1',
        createQuery({ from: '2026-05-01' }),
      );

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            date: {
              gte: new Date('2026-05-01T00:00:00.000Z'),
            },
          },
        }),
      );
      expect(prisma.transaction.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          date: {
            gte: new Date('2026-05-01T00:00:00.000Z'),
          },
        },
      });
    });

    it('builds an open-ended to date filter with an exclusive next-day bound', async () => {
      const { prisma, service } = createService();

      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await service.getTransactions(
        'user-1',
        createQuery({ to: '2026-05-31' }),
      );

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            date: {
              lt: new Date('2026-06-01T00:00:00.000Z'),
            },
          },
        }),
      );
      expect(prisma.transaction.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          date: {
            lt: new Date('2026-06-01T00:00:00.000Z'),
          },
        },
      });
    });

    it('rejects date ranges where from is after to', async () => {
      const { prisma, service } = createService();

      await expect(
        service.getTransactions(
          'user-1',
          createQuery({ from: '2026-06-01', to: '2026-05-31' }),
        ),
      ).rejects.toThrow('From date must be less than or equal to to date');

      expect(prisma.transaction.findMany).not.toHaveBeenCalled();
      expect(prisma.transaction.count).not.toHaveBeenCalled();
    });

    it('rejects invalid date filters before querying Prisma', async () => {
      const { prisma, service } = createService();

      await expect(
        service.getTransactions('user-1', createQuery({ from: '2026-02-31' })),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.transaction.findMany).not.toHaveBeenCalled();
      expect(prisma.transaction.count).not.toHaveBeenCalled();
    });

    it('rejects quantity ranges where minimum is greater than maximum', async () => {
      const { prisma, service } = createService();

      await expect(
        service.getTransactions(
          'user-1',
          createQuery({ minQuantity: 11, maxQuantity: 10 }),
        ),
      ).rejects.toThrow(
        'Quantity minimum must be less than or equal to maximum',
      );

      expect(prisma.transaction.findMany).not.toHaveBeenCalled();
      expect(prisma.transaction.count).not.toHaveBeenCalled();
    });

    it('rejects total ranges where minimum is greater than maximum', async () => {
      const { prisma, service } = createService();

      await expect(
        service.getTransactions(
          'user-1',
          createQuery({ minTotalCents: 15000, maxTotalCents: 500 }),
        ),
      ).rejects.toThrow('Total minimum must be less than or equal to maximum');

      expect(prisma.transaction.findMany).not.toHaveBeenCalled();
      expect(prisma.transaction.count).not.toHaveBeenCalled();
    });
  });

  describe('createTransaction', () => {
    it('creates a transaction and upserts its calendar month date range', async () => {
      const { prisma, service } = createService();
      const dto: CreateTransactionDto = {
        name: 'Grace Hopper',
        email: 'grace@example.com',
        product: 'Dashdesk Enterprise',
        quantity: 5,
        totalCents: 12500,
        date: '2024-02-29',
      };

      prisma.transaction.create.mockResolvedValue({
        id: 'transaction-1',
        name: dto.name,
        email: dto.email,
        product: dto.product,
        quantity: dto.quantity,
        totalCents: dto.totalCents,
      });
      prisma.transactionDateRange.upsert.mockResolvedValue({
        id: 'range-1',
      });

      await expect(service.createTransaction('user-1', dto)).resolves.toEqual({
        id: 'transaction-1',
        name: dto.name,
        email: dto.email,
        product: dto.product,
        quantity: '5 pcs',
        total: '$125',
      });

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: dto.name,
          email: dto.email,
          product: dto.product,
          quantity: dto.quantity,
          totalCents: dto.totalCents,
          date: new Date('2024-02-29T00:00:00.000Z'),
        },
        select: {
          id: true,
          name: true,
          email: true,
          product: true,
          quantity: true,
          totalCents: true,
        },
      });
      expect(prisma.transactionDateRange.upsert).toHaveBeenCalledWith({
        where: {
          userId_startsAt_endsAt: {
            userId: 'user-1',
            startsAt: new Date('2024-02-01T00:00:00.000Z'),
            endsAt: new Date('2024-02-29T00:00:00.000Z'),
          },
        },
        create: {
          userId: 'user-1',
          startsAt: new Date('2024-02-01T00:00:00.000Z'),
          endsAt: new Date('2024-02-29T00:00:00.000Z'),
        },
        update: {},
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('rejects invalid transaction dates before querying Prisma', async () => {
      const { prisma, service } = createService();
      const dto: CreateTransactionDto = {
        name: 'Grace Hopper',
        email: 'grace@example.com',
        product: 'Dashdesk Enterprise',
        quantity: 5,
        totalCents: 12500,
        date: '2026-02-31',
      };

      await expect(
        service.createTransaction('user-1', dto),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.transaction.create).not.toHaveBeenCalled();
      expect(prisma.transactionDateRange.upsert).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
