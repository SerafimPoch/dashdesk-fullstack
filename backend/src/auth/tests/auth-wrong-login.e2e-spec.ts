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
} from './auth-e2e.helpers';

describe('Auth e2e: wrong login', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Wrong Login User',
    email: `auth-wrong-login-e2e-${Date.now()}@example.com`,
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

  it('rejects invalid credentials and does not set auth cookies', async () => {
    if (!app || !prisma || !createdUserId) {
      throw new Error('E2E app was not initialized');
    }

    const wrongLoginResponse = await createHttpAgent(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPass123',
      });

    expect(wrongLoginResponse.status).toBe(401);
    const wrongLoginBody = getBody<ErrorResponseBody>(wrongLoginResponse.body);
    expect(wrongLoginBody).toMatchObject({
      message: 'Invalid email or password',
      error: 'Unauthorized',
      statusCode: 401,
    });

    const cookies = getCookies(wrongLoginResponse.headers['set-cookie']);
    expect(getCookieValue(cookies, ACCESS_TOKEN_COOKIE)).toBeUndefined();
    expect(getCookieValue(cookies, REFRESH_TOKEN_COOKIE)).toBeUndefined();
    await expect(
      prisma.session.count({ where: { userId: createdUserId } }),
    ).resolves.toBe(0);
  });
});
