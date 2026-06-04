import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardActivitiesPeriod,
  DashboardActivitiesQueryDto,
} from '../dto/dashboard-activities.dto';
import {
  DashboardTopProductsPeriod,
  DashboardTopProductsQueryDto,
} from '../dto/dashboard-top-products.dto';
import { DashboardService } from '../dashboard.service';

type PrismaMock = {
  user: {
    count: ReturnType<typeof jest.fn>;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    user: {
      count: jest.fn(),
    },
  };
}

function createService() {
  const prisma = createPrismaMock();
  const service = new DashboardService(prisma as unknown as PrismaService);

  return { prisma, service };
}

function createActivitiesQuery(
  period: DashboardActivitiesPeriod = DashboardActivitiesPeriod.LAST_4_WEEKS,
): DashboardActivitiesQueryDto {
  return Object.assign(new DashboardActivitiesQueryDto(), { period });
}

function createTopProductsQuery(
  period: DashboardTopProductsPeriod = DashboardTopProductsPeriod.LAST_4_WEEKS,
): DashboardTopProductsQueryDto {
  return Object.assign(new DashboardTopProductsQueryDto(), { period });
}

describe('DashboardService', () => {
  describe('summary', () => {
    it('returns summary metrics with the current user count', async () => {
      const { prisma, service } = createService();

      prisma.user.count.mockResolvedValue(42);

      await expect(service.summary()).resolves.toEqual({
        totalRevenue: 2129430,
        totalTransactions: 1520,
        totalLikes: 9721,
        totalUsers: 42,
      });
      expect(prisma.user.count).toHaveBeenCalledWith();
    });
  });

  describe('activities', () => {
    it('returns the last 4 weeks activity dataset by default', () => {
      const { service } = createService();

      expect(
        service.activities(
          Object.assign(new DashboardActivitiesQueryDto(), {}),
        ),
      ).toEqual({
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
      });
    });

    it('returns the last 8 weeks activity dataset', () => {
      const { service } = createService();

      expect(
        service.activities(
          createActivitiesQuery(DashboardActivitiesPeriod.LAST_8_WEEKS),
        ),
      ).toEqual({
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
      });
    });

    it('returns the last 12 weeks activity dataset', () => {
      const { service } = createService();

      expect(
        service.activities(
          createActivitiesQuery(DashboardActivitiesPeriod.LAST_12_WEEKS),
        ),
      ).toEqual({
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
      });
    });
  });

  describe('topProducts', () => {
    it('returns the last 4 weeks top products dataset by default', () => {
      const { service } = createService();

      expect(
        service.topProducts(
          Object.assign(new DashboardTopProductsQueryDto(), {}),
        ),
      ).toEqual({
        period: DashboardTopProductsPeriod.LAST_4_WEEKS,
        periodLabel: 'May - June 2023',
        items: [
          {
            key: 'basic-tees',
            name: 'Basic Tees',
            percentage: 10,
          },
          {
            key: 'custom-short-pants',
            name: 'Custom Short Pants',
            percentage: 70,
          },
          {
            key: 'super-hoodies',
            name: 'Super Hoodies',
            percentage: 20,
          },
        ],
      });
    });

    it('returns the last 8 weeks top products dataset', () => {
      const { service } = createService();

      expect(
        service.topProducts(
          createTopProductsQuery(DashboardTopProductsPeriod.LAST_8_WEEKS),
        ),
      ).toEqual({
        period: DashboardTopProductsPeriod.LAST_8_WEEKS,
        periodLabel: 'May - June 2022',
        items: [
          {
            key: 'basic-tees',
            name: 'Basic Tees',
            percentage: 40,
          },
          {
            key: 'custom-short-pants',
            name: 'Custom Short Pants',
            percentage: 30,
          },
          {
            key: 'super-hoodies',
            name: 'Super Hoodies',
            percentage: 30,
          },
        ],
      });
    });

    it('returns the last 12 weeks top products dataset', () => {
      const { service } = createService();

      expect(
        service.topProducts(
          createTopProductsQuery(DashboardTopProductsPeriod.LAST_12_WEEKS),
        ),
      ).toEqual({
        period: DashboardTopProductsPeriod.LAST_12_WEEKS,
        periodLabel: 'May - June 2021',
        items: [
          {
            key: 'basic-tees',
            name: 'Basic Tees',
            percentage: 10,
          },
          {
            key: 'custom-short-pants',
            name: 'Custom Short Pants',
            percentage: 20,
          },
          {
            key: 'super-hoodies',
            name: 'Super Hoodies',
            percentage: 70,
          },
        ],
      });
    });
  });
});
