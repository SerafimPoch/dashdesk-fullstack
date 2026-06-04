import type { INestApplication } from '@nestjs/common';
import { ScheduleAccent } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createSchedulesE2eApp,
  createScheduleTestUser,
  deleteUserByEmail,
  getBody,
  loginScheduleTestUser,
  seedSchedule,
  type SchedulesListResponse,
} from './schedules-e2e.helpers';

describe('Schedules e2e: date filter and user isolation', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;

  const testUser = {
    name: 'E2E Schedules Filter User',
    email: `schedules-filter-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };
  const otherUser = {
    name: 'E2E Other Schedules User',
    email: `schedules-other-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    const e2eApp = await createSchedulesE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;

    const createdUser = await createScheduleTestUser(prisma, testUser);
    const createdOtherUser = await createScheduleTestUser(prisma, otherUser);

    await seedSchedule(prisma, createdUser.id, {
      title: 'Morning planning',
      startsAt: '2026-05-28T08:00:00.000Z',
      endsAt: '2026-05-28T08:30:00.000Z',
      location: 'Room A',
      accent: ScheduleAccent.GREEN,
    });
    await seedSchedule(prisma, createdUser.id, {
      title: 'Product review',
      startsAt: '2026-05-28T10:00:00.000Z',
      endsAt: '2026-05-28T11:00:00.000Z',
      location: 'Room B',
      accent: ScheduleAccent.PURPLE,
    });
    await seedSchedule(prisma, createdUser.id, {
      title: 'Next day sync',
      startsAt: '2026-05-29T09:00:00.000Z',
      endsAt: '2026-05-29T09:30:00.000Z',
      location: 'Room C',
      accent: ScheduleAccent.GREEN,
    });
    await seedSchedule(prisma, createdOtherUser.id, {
      title: 'Other user meeting',
      startsAt: '2026-05-28T09:00:00.000Z',
      endsAt: '2026-05-28T09:30:00.000Z',
      location: 'Room D',
      accent: ScheduleAccent.PURPLE,
    });
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await deleteUserByEmail(prisma, otherUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('returns only current user schedules ordered by start time', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginScheduleTestUser(app, testUser);

    const response = await agent.get('/api/schedules');

    expect(response.status).toBe(200);
    const body = getBody<SchedulesListResponse>(response.body);
    expect(body.items.map((item) => item.title)).toEqual([
      'Morning planning',
      'Product review',
      'Next day sync',
    ]);
    expect(body.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Other user meeting' }),
      ]),
    );
  });

  it('filters schedules by UTC date', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginScheduleTestUser(app, testUser);

    const response = await agent.get('/api/schedules').query({
      date: '2026-05-28',
    });

    expect(response.status).toBe(200);
    const body = getBody<SchedulesListResponse>(response.body);
    expect(body.items.map((item) => item.title)).toEqual([
      'Morning planning',
      'Product review',
    ]);
    expect(
      body.items.every((item) => item.startsAt.startsWith('2026-05-28')),
    ).toBe(true);
  });
});
