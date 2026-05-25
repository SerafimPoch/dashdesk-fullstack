import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const DATE_ONLY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class GetTransactionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const search = value.trim();

    return search.length > 0 ? search : undefined;
  })
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  @IsISO8601({ strict: true })
  to?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const product = value.trim();

    return product.length > 0 ? product : undefined;
  })
  @IsString()
  @MaxLength(120)
  product?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  minQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  maxQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  minTotalCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  maxTotalCents?: number;
}

export class CreateTransactionDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  product!: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity!: number;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  totalCents!: number;

  @Matches(DATE_ONLY_PATTERN)
  @IsISO8601({ strict: true })
  date!: string;
}

export interface TransactionItemDto {
  id: string;
  name: string;
  email: string;
  product: string;
  quantity: string;
  total: string;
}

export interface TransactionsPaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsListDto {
  items: TransactionItemDto[];
  meta: TransactionsPaginationMetaDto;
}

export interface TransactionDateRangeOptionDto {
  value: string;
  from: string;
  to: string;
}

export interface TransactionDateRangesDto {
  items: TransactionDateRangeOptionDto[];
}
