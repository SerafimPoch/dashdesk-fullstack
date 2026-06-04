import type { INestApplication } from '@nestjs/common';
import {
  DashboardActivitiesPeriod,
  type DashboardActivitiesDto,
} from '../dto/dashboard-activities.dto';
import {
  DashboardTopProductsPeriod,
  type DashboardTopProductsDto,
} from '../dto/dashboard-top-products.dto';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createDashboardE2eApp,
  createDashboardTestUser,
  deleteUserByEmail,
  getBody,
  loginDashboardTestUser,
} from './dashboard-e2e.helpers';

describe('Dashboard e2e: datasets', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;

  const testUser = {
    name: 'E2E Dashboard Datasets User',
    email: `dashboard-datasets-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    const e2eApp = await createDashboardE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;

    await createDashboardTestUser(prisma, testUser);
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('returns default and selected activities datasets', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginDashboardTestUser(app, testUser);

    const defaultResponse = await agent.get('/api/dashboard/activities');

    expect(defaultResponse.status).toBe(200);
    expect(getBody<DashboardActivitiesDto>(defaultResponse.body)).toEqual({
      period: DashboardActivitiesPeriod.LAST_4_WEEKS,
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

    const selectedResponse = await agent
      .get('/api/dashboard/activities')
      .query({
        period: DashboardActivitiesPeriod.LAST_12_WEEKS,
      });

    expect(selectedResponse.status).toBe(200);
    expect(
      getBody<DashboardActivitiesDto>(selectedResponse.body),
    ).toMatchObject({
      period: DashboardActivitiesPeriod.LAST_12_WEEKS,
      series: [
        {
          key: 'guest',
          values: [590, 100, 900, 320],
        },
        {
          key: 'user',
          values: [420, 150, 450, 180],
        },
      ],
    });
  });

  it('returns default and selected top products datasets', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginDashboardTestUser(app, testUser);

    const defaultResponse = await agent.get('/api/dashboard/top-products');

    expect(defaultResponse.status).toBe(200);
    expect(getBody<DashboardTopProductsDto>(defaultResponse.body)).toEqual({
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

    const selectedResponse = await agent
      .get('/api/dashboard/top-products')
      .query({
        period: DashboardTopProductsPeriod.LAST_8_WEEKS,
      });

    expect(selectedResponse.status).toBe(200);
    expect(
      getBody<DashboardTopProductsDto>(selectedResponse.body),
    ).toMatchObject({
      period: DashboardTopProductsPeriod.LAST_8_WEEKS,
      periodLabel: 'May - June 2022',
      items: [
        {
          key: 'basic-tees',
          percentage: 40,
        },
        {
          key: 'custom-short-pants',
          percentage: 30,
        },
        {
          key: 'super-hoodies',
          percentage: 30,
        },
      ],
    });
  });
});
