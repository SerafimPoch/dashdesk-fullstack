import { ScheduleAccent } from '@prisma/client';
import { Transform } from 'class-transformer';
import { DATE_ONLY_PATTERN } from '../common/date/date-only';
import { trimString } from '../common/transforms/string';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GetSchedulesQueryDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
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

export interface ScheduleItemDto {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string;
  accent: ScheduleAccent;
}

export interface SchedulesListDto {
  items: ScheduleItemDto[];
}
