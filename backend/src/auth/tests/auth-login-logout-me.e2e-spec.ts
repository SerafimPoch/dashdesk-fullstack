import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../auth-cookie';
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
} from './auth-e2e.helpers';

describe('Auth e2e: login -> logout -> me', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Logout User',
    email: `auth-logout-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    const e2eApp = await createAuthE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;

    await deleteUserByEmail(e2eApp.prisma, testUser.email);
    const createdUser = await createPasswordUser(e2eApp.prisma, testUser);
    createdUserId = createdUser.id;
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('logs in, logs out, and rejects the current user request', async () => {
    if (!app || !prisma || !createdUserId) {
      throw new Error('E2E app was not initialized');
    }

    const agent = createHttpAgent(app);

    const loginResponse = await agent.post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(loginResponse.status).toBe(201);
    const loginBody = getBody<LoginResponseBody>(loginResponse.body);
    expect(loginBody).toEqual({
      message: 'User logged in successfully',
      user: {
        email: testUser.email,
      },
    });

    const loginCookies = getCookies(loginResponse.headers['set-cookie']);
    expect(getCookieValue(loginCookies, ACCESS_TOKEN_COOKIE)).toBeDefined();
    expect(getCookieValue(loginCookies, REFRESH_TOKEN_COOKIE)).toBeDefined();
    await expect(
      prisma.session.count({ where: { userId: createdUserId } }),
    ).resolves.toBe(1);

    const logoutResponse = await agent.post('/api/auth/logout');

    expect(logoutResponse.status).toBe(201);

    const logoutCookies = getCookies(logoutResponse.headers['set-cookie']);
    expect(getCookieValue(logoutCookies, ACCESS_TOKEN_COOKIE)).toBe('');
    expect(getCookieValue(logoutCookies, REFRESH_TOKEN_COOKIE)).toBe('');
    await expect(
      prisma.session.count({ where: { userId: createdUserId } }),
    ).resolves.toBe(0);

    const meResponse = await agent.get('/api/auth/me');

    expect(meResponse.status).toBe(401);
    const meBody = getBody<ErrorResponseBody>(meResponse.body);
    expect(meBody).toMatchObject({
      message: 'Unauthorized',
      statusCode: 401,
    });
  });
});
