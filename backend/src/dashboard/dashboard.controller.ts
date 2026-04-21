import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async summary(): Promise<DashboardSummaryDto> {
    const data = await this.dashboard.summary();

    return data;
  }
}
