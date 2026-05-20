import { ScheduleAccent } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class GetSchedulesQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  date?: string;
}

export class CreateScheduleDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location!: string;

  @IsEnum(ScheduleAccent)
  accent!: ScheduleAccent;
}

export class ScheduleItemDto {
  id!: string;
  title!: string;
  startsAt!: Date;
  endsAt!: Date;
  location!: string;
  accent!: ScheduleAccent;
}

export class SchedulesListDto {
  items!: ScheduleItemDto[];
}
