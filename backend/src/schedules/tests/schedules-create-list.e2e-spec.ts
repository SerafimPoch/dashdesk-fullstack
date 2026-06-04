import type { INestApplication } from '@nestjs/common';
import { ScheduleAccent } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createSchedulesE2eApp,
  createScheduleTestUser,
  deleteUserByEmail,
  getBody,
  loginScheduleTestUser,
  type ScheduleItemResponse,
  type SchedulesListResponse,
} from './schedules-e2e.helpers';

describe('Schedules e2e: create -> list', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Schedules User',
    email: `schedules-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  const schedule = {
    title: 'Product review',
    startsAt: '2026-05-28T09:00:00.000Z',
    endsAt: '2026-05-28T10:00:00.000Z',
    location: 'Conference Room',
    accent: ScheduleAccent.PURPLE,
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

  it('creates a schedule and lists it for the current user', async () => {
    if (!app || !prisma || !createdUserId) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginScheduleTestUser(app, testUser);

    const createResponse = await agent.post('/api/schedules').send(schedule);

    expect(createResponse.status).toBe(201);
    const createdSchedule = getBody<ScheduleItemResponse>(createResponse.body);
    expect(createdSchedule).toEqual({
      id: expect.any(String) as string,
      title: schedule.title,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
      location: schedule.location,
      accent: schedule.accent,
    });

    const dbSchedule = await prisma.schedule.findUnique({
      where: { id: createdSchedule.id },
      select: {
        userId: true,
        title: true,
        startsAt: true,
        endsAt: true,
        location: true,
        accent: true,
      },
    });

    expect(dbSchedule).toEqual({
      userId: createdUserId,
      title: schedule.title,
      startsAt: new Date(schedule.startsAt),
      endsAt: new Date(schedule.endsAt),
      location: schedule.location,
      accent: schedule.accent,
    });

    const listResponse = await agent.get('/api/schedules');

    expect(listResponse.status).toBe(200);
    expect(getBody<SchedulesListResponse>(listResponse.body)).toEqual({
      items: [createdSchedule],
    });
  });
});
