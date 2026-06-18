import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
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
  createAuthE2eApp as createSettingsE2eApp,
  createHttpAgent,
  deleteUserByEmail,
  getBody,
  getCookies,
  type ErrorResponseBody,
};

export interface SettingsTestUser {
  name: string;
  email: string;
  password: string;
}

export async function createSettingsTestUser(
  prisma: PrismaService,
  user: SettingsTestUser,
) {
  await deleteUserByEmail(prisma, user.email);

  return createPasswordUser(prisma, user);
}

export async function loginSettingsTestUser(
  app: INestApplication,
  user: SettingsTestUser,
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
