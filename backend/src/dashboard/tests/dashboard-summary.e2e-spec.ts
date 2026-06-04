import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createDashboardE2eApp,
  createDashboardTestUser,
  deleteUserByEmail,
  getBody,
  loginDashboardTestUser,
  type DashboardSummaryDto,
} from './dashboard-e2e.helpers';

describe('Dashboard e2e: summary', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;

  const testUser = {
    name: 'E2E Dashboard User',
    email: `dashboard-e2e-${Date.now()}@example.com`,
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

  it('returns summary metrics with a database user count', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginDashboardTestUser(app, testUser);

    const response = await agent.get('/api/dashboard/summary');

    expect(response.status).toBe(200);
    const body = getBody<DashboardSummaryDto>(response.body);
    expect(body.totalRevenue).toBe(2129430);
    expect(body.totalTransactions).toBe(1520);
    expect(body.totalLikes).toBe(9721);
    expect(typeof body.totalUsers).toBe('number');
    expect(body.totalUsers).toBeGreaterThanOrEqual(1);
  });
});
