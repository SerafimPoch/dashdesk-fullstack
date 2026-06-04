import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createDashboardE2eApp,
  createDashboardTestUser,
  createHttpAgent,
  deleteUserByEmail,
  getBody,
  loginDashboardTestUser,
  type ErrorResponseBody,
} from './dashboard-e2e.helpers';

describe('Dashboard e2e: protection and validation', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;

  const testUser = {
    name: 'E2E Dashboard Validation User',
    email: `dashboard-validation-e2e-${Date.now()}@example.com`,
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

  it('rejects unauthenticated dashboard requests', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = createHttpAgent(app);

    await expect(agent.get('/api/dashboard/summary')).resolves.toMatchObject({
      status: 401,
    });
    await expect(agent.get('/api/dashboard/activities')).resolves.toMatchObject(
      {
        status: 401,
      },
    );
    await expect(
      agent.get('/api/dashboard/top-products'),
    ).resolves.toMatchObject({
      status: 401,
    });
  });

  it('rejects invalid dashboard period filters', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginDashboardTestUser(app, testUser);

    const activitiesResponse = await agent
      .get('/api/dashboard/activities')
      .query({
        period: 'last-2-weeks',
      });

    expect(activitiesResponse.status).toBe(400);
    const activitiesBody = getBody<ErrorResponseBody>(activitiesResponse.body);
    expect(activitiesBody.statusCode).toBe(400);
    expect(activitiesBody.error).toBe('Bad Request');
    expect(Array.isArray(activitiesBody.message)).toBe(true);

    const topProductsResponse = await agent
      .get('/api/dashboard/top-products')
      .query({
        period: 'last-2-weeks',
      });

    expect(topProductsResponse.status).toBe(400);
    const topProductsBody = getBody<ErrorResponseBody>(
      topProductsResponse.body,
    );
    expect(topProductsBody.statusCode).toBe(400);
    expect(topProductsBody.error).toBe('Bad Request');
    expect(Array.isArray(topProductsBody.message)).toBe(true);
  });
});
