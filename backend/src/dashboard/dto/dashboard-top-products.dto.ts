import { IsEnum, IsOptional } from 'class-validator';

export enum DashboardTopProductsPeriod {
  LAST_4_WEEKS = 'last-4-weeks',
  LAST_8_WEEKS = 'last-8-weeks',
  LAST_12_WEEKS = 'last-12-weeks',
}

export class DashboardTopProductsQueryDto {
  @IsOptional()
  @IsEnum(DashboardTopProductsPeriod)
  period: DashboardTopProductsPeriod = DashboardTopProductsPeriod.LAST_4_WEEKS;
}

class DashboardTopProductDto {
  key!: 'basic-tees' | 'custom-short-pants' | 'super-hoodies';
  name!: string;
  percentage!: number;
}

export class DashboardTopProductsDto {
  period!: DashboardTopProductsPeriod;
  periodLabel!: string;
  items!: DashboardTopProductDto[];
}
