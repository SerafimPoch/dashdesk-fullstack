import { IsEnum, IsOptional } from 'class-validator';

export enum DashboardActivitiesPeriod {
  LAST_4_WEEKS = 'last-4-weeks',
  LAST_8_WEEKS = 'last-8-weeks',
  LAST_12_WEEKS = 'last-12-weeks',
}

export class DashboardActivitiesQueryDto {
  @IsOptional()
  @IsEnum(DashboardActivitiesPeriod)
  period: DashboardActivitiesPeriod = DashboardActivitiesPeriod.LAST_4_WEEKS;
}
class DashboardActivitiesSeriesDto {
  key!: 'guest' | 'user';
  label!: string;
  values!: number[];
}

export class DashboardActivitiesDto {
  period!: 'last-4-weeks' | 'last-8-weeks' | 'last-12-weeks';
  periodLabel!: string;
  labels!: string[];
  series!: DashboardActivitiesSeriesDto[];
}
