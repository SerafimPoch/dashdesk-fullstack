import type { INestApplication } from '@nestjs/common';
import { ScheduleAccent } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ScheduleItemDto, SchedulesListDto } from '../schedules.dto';
import {
  createAuthE2eApp,
  createHttpAgent,
  createPasswordUser,
  deleteUserByEmail,
  getBody,
  getCookies,
  getCookieValue,
  type ErrorResponseBody,
  type LoginResponseBody,
} from '../../auth/tests/auth-e2e.helpers';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../auth/auth-cookie';

export {
  createAuthE2eApp as createSchedulesE2eApp,
  createHttpAgent,
  deleteUserByEmail,
  getBody,
  type ErrorResponseBody,
};

export type ScheduleItemResponse = Omit<
  ScheduleItemDto,
  'startsAt' | 'endsAt'
> & {
  startsAt: string;
  endsAt: string;
};

export interface SchedulesListResponse extends Omit<SchedulesListDto, 'items'> {
  items: ScheduleItemResponse[];
}

export interface ScheduleTestUser {
  name: string;
  email: string;
  password: string;
}

export interface ScheduleSeed {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  accent: ScheduleAccent;
}

export async function createScheduleTestUser(
  prisma: PrismaService,
  user: ScheduleTestUser,
) {
  await deleteUserByEmail(prisma, user.email);

  return createPasswordUser(prisma, user);
}

export async function loginScheduleTestUser(
  app: INestApplication,
  user: ScheduleTestUser,
) {
  const agent = createHttpAgent(app);
  const response = await agent.post('/api/auth/login').send({
    email: user.email,
    password: user.password,
  });

  expect(response.status).toBe(201);
  const body = getBody<LoginResponseBody>(response.body);
  expect(body).toEqual({
    message: 'User logged in successfully',
    user: {
      email: user.email,
    },
  });

  const cookies = getCookies(response.headers['set-cookie']);
  expect(getCookieValue(cookies, ACCESS_TOKEN_COOKIE)).toBeDefined();
  expect(getCookieValue(cookies, REFRESH_TOKEN_COOKIE)).toBeDefined();

  return agent;
}

export async function seedSchedule(
  prisma: PrismaService,
  userId: string,
  data: ScheduleSeed,
) {
  return prisma.schedule.create({
    data: {
      userId,
      title: data.title,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      location: data.location,
      accent: data.accent,
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      location: true,
      accent: true,
    },
  });
}
