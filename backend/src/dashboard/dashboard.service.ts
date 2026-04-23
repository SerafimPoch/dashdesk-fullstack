import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import {
  DashboardActivitiesDto,
  DashboardActivitiesPeriod,
  DashboardActivitiesQueryDto,
} from './dto/dashboard-activities.dto';

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

  activities(query: DashboardActivitiesQueryDto): DashboardActivitiesDto {
    if (query.period === DashboardActivitiesPeriod.LAST_12_WEEKS) {
      return {
        period: 'last-12-weeks',
        periodLabel: 'May - June 2021',
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        series: [
          {
            key: 'guest',
            label: 'Guest',
            values: [590, 100, 900, 320],
          },
          {
            key: 'user',
            label: 'User',
            values: [420, 150, 450, 180],
          },
        ],
      };
    }

    if (query.period === DashboardActivitiesPeriod.LAST_8_WEEKS) {
      return {
        period: 'last-8-weeks',
        periodLabel: 'May - June 2021',
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        series: [
          {
            key: 'guest',
            label: 'Guest',
            values: [190, 300, 400, 720],
          },
          {
            key: 'user',
            label: 'User',
            values: [420, 150, 450, 180],
          },
        ],
      };
    }

    return {
      period: 'last-4-weeks',
      periodLabel: 'May - June 2021',
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      series: [
        {
          key: 'guest',
          label: 'Guest',
          values: [390, 200, 300, 220],
        },
        {
          key: 'user',
          label: 'User',
          values: [420, 150, 450, 180],
        },
      ],
    };
  }
}
