import type { INestApplication } from '@nestjs/common';
import { ScheduleAccent } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createHttpAgent,
  createSchedulesE2eApp,
  createScheduleTestUser,
  deleteUserByEmail,
  getBody,
  loginScheduleTestUser,
  type ErrorResponseBody,
} from './schedules-e2e.helpers';

describe('Schedules e2e: protection and validation', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Schedules Validation User',
    email: `schedules-validation-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  const validSchedule = {
    title: 'Product review',
    startsAt: '2026-05-28T09:00:00.000Z',
    endsAt: '2026-05-28T10:00:00.000Z',
    location: 'Conference Room',
    accent: ScheduleAccent.GREEN,
  };

  beforeAll(async () => {
    const e2eApp = await createSchedulesE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;

    const createdUser = await createScheduleTestUser(prisma, testUser);
    createdUserId = createdUser.id;
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('rejects unauthenticated schedule requests', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = createHttpAgent(app);

    await expect(agent.get('/api/schedules')).resolves.toMatchObject({
      status: 401,
    });
    await expect(
      agent.post('/api/schedules').send(validSchedule),
    ).resolves.toMatchObject({
      status: 401,
    });
  });

  it('rejects invalid create payloads and invalid schedule intervals', async () => {
    if (!app || !prisma || !createdUserId) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginScheduleTestUser(app, testUser);

    const invalidPayloadResponse = await agent.post('/api/schedules').send({
      title: 'A',
      startsAt: 'not-a-date',
      endsAt: '2026-05-28T10:00:00.000Z',
      location: 'R',
      accent: 'BLUE',
    });

    expect(invalidPayloadResponse.status).toBe(400);
    const invalidPayloadBody = getBody<ErrorResponseBody>(
      invalidPayloadResponse.body,
    );
    expect(invalidPayloadBody.statusCode).toBe(400);
    expect(Array.isArray(invalidPayloadBody.message)).toBe(true);
    await expect(
      prisma.schedule.count({ where: { userId: createdUserId } }),
    ).resolves.toBe(0);

    const invalidIntervalResponse = await agent.post('/api/schedules').send({
      ...validSchedule,
      startsAt: '2026-05-28T10:00:00.000Z',
      endsAt: '2026-05-28T09:00:00.000Z',
    });

    expect(invalidIntervalResponse.status).toBe(400);
    expect(
      getBody<ErrorResponseBody>(invalidIntervalResponse.body),
    ).toMatchObject({
      message: 'End time must be after start time',
      error: 'Bad Request',
      statusCode: 400,
    });
    await expect(
      prisma.schedule.count({ where: { userId: createdUserId } }),
    ).resolves.toBe(0);
  });

  it('rejects invalid date filters', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginScheduleTestUser(app, testUser);

    const response = await agent.get('/api/schedules').query({
      date: '2026-02-31',
    });

    expect(response.status).toBe(400);
    expect(getBody<ErrorResponseBody>(response.body)).toMatchObject({
      message: 'Date must be a valid calendar date',
      error: 'Bad Request',
      statusCode: 400,
    });
  });
});
