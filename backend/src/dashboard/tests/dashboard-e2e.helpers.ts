import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import type { DashboardSummaryDto } from '../dto/dashboard-summary.dto';
import type { DashboardActivitiesDto } from '../dto/dashboard-activities.dto';
import type { DashboardTopProductsDto } from '../dto/dashboard-top-products.dto';
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
  createAuthE2eApp as createDashboardE2eApp,
  createHttpAgent,
  deleteUserByEmail,
  getBody,
  type DashboardActivitiesDto,
  type DashboardSummaryDto,
  type DashboardTopProductsDto,
  type ErrorResponseBody,
};

export interface DashboardTestUser {
  name: string;
  email: string;
  password: string;
}

export async function createDashboardTestUser(
  prisma: PrismaService,
  user: DashboardTestUser,
) {
  await deleteUserByEmail(prisma, user.email);

  return createPasswordUser(prisma, user);
}

export async function loginDashboardTestUser(
  app: INestApplication,
  user: DashboardTestUser,
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
