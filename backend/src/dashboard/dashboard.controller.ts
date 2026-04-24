import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import {
  DashboardActivitiesDto,
  DashboardActivitiesQueryDto,
} from './dto/dashboard-activities.dto';
import {
  DashboardTopProductsDto,
  DashboardTopProductsQueryDto,
} from './dto/dashboard-top-products.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async summary(): Promise<DashboardSummaryDto> {
    const data = await this.dashboard.summary();

    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Get('activities')
  activities(
    @Query() query: DashboardActivitiesQueryDto,
  ): DashboardActivitiesDto {
    const data = this.dashboard.activities(query);

    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Get('top-products')
  topProducts(
    @Query() query: DashboardTopProductsQueryDto,
  ): DashboardTopProductsDto {
    const data = this.dashboard.topProducts(query);

    return data;
  }
}
