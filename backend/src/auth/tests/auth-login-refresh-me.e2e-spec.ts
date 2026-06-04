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
  type LoginResponseBody,
  type MeResponseBody,
} from './auth-e2e.helpers';

describe('Auth e2e: login -> refresh -> me', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Refresh User',
    email: `auth-refresh-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    const e2eApp = await createAuthE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;

    await deleteUserByEmail(prisma, testUser.email);

    const createdUser = await createPasswordUser(prisma, testUser);
    createdUserId = createdUser.id;
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('logs in, refreshes tokens, and returns the current user', async () => {
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
    const originalRefreshToken = getCookieValue(
      loginCookies,
      REFRESH_TOKEN_COOKIE,
    );

    expect(getCookieValue(loginCookies, ACCESS_TOKEN_COOKIE)).toBeDefined();
    expect(originalRefreshToken).toBeDefined();

    if (!originalRefreshToken) {
      throw new Error('Refresh token was not set');
    }

    const sessionId = originalRefreshToken.split('.')[0];
    const originalSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { tokenHash: true, userId: true },
    });

    expect(typeof originalSession?.tokenHash).toBe('string');
    expect(originalSession?.userId).toBe(createdUserId);

    const refreshResponse = await agent.post('/api/auth/refresh');

    expect(refreshResponse.status).toBe(201);
    expect(getBody<Record<string, never>>(refreshResponse.body)).toEqual({});

    const refreshCookies = getCookies(refreshResponse.headers['set-cookie']);
    const nextRefreshToken = getCookieValue(
      refreshCookies,
      REFRESH_TOKEN_COOKIE,
    );

    expect(getCookieValue(refreshCookies, ACCESS_TOKEN_COOKIE)).toBeDefined();
    expect(nextRefreshToken).toBeDefined();
    expect(nextRefreshToken).not.toBe(originalRefreshToken);

    const rotatedSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { tokenHash: true, userId: true },
    });

    expect(typeof rotatedSession?.tokenHash).toBe('string');
    expect(rotatedSession?.userId).toBe(createdUserId);
    expect(rotatedSession?.tokenHash).not.toBe(originalSession?.tokenHash);
    await expect(
      prisma.session.count({ where: { userId: createdUserId } }),
    ).resolves.toBe(1);

    const meResponse = await agent.get('/api/auth/me');

    expect(meResponse.status).toBe(200);
    const meBody = getBody<MeResponseBody>(meResponse.body);
    expect(meBody).toEqual({
      id: createdUserId,
      email: testUser.email,
    });
  });
});
