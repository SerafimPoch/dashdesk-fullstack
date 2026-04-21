import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<DashboardSummaryDto> {
    const totalUsers = await this.prisma.user.count();

    return {
      totalRevenue: 2129430,
      totalTransactions: 1520,
      totalLikes: 9721,
      totalUsers,
    };
  }
}
