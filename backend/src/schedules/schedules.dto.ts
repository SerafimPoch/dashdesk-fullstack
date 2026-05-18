import { IsOptional, Matches } from 'class-validator';

export enum ScheduleAccent {
  GREEN = 'green',
  PURPLE = 'purple',
}

export class GetSchedulesQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  date?: string;
}

export class ScheduleItemDto {
  id!: string;
  title!: string;
  date!: string;
  startsAt!: string;
  endsAt!: string;
  time!: string;
  location!: string;
  accent!: ScheduleAccent;
}

export class SchedulesListDto {
  items!: ScheduleItemDto[];
}
