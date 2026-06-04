import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../auth-cookie';
import {
  createAuthE2eApp,
  createHttpAgent,
  deleteUserByEmail,
  getBody,
  getCookies,
  getCookieValue,
  type LoginResponseBody,
  type MeResponseBody,
  type RegisterResponseBody,
} from './auth-e2e.helpers';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';

describe('Auth e2e: register -> login -> me', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;

  const testUser = {
    name: 'E2E Auth User',
    email: `auth-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    const e2eApp = await createAuthE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;
    await deleteUserByEmail(prisma, testUser.email);
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('registers, logs in, and returns the current user', async () => {
    if (!app || !prisma) {
      throw new Error('E2E app was not initialized');
    }

    const agent = createHttpAgent(app);

    const registerResponse = await agent
      .post('/api/auth/register')
      .send(testUser);

    expect(registerResponse.status).toBe(201);
    const registerBody = getBody<RegisterResponseBody>(registerResponse.body);
    expect(registerBody).toEqual({
      message: `User ${testUser.name} with ${testUser.email} was successfully created`,
    });

    const createdUser = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: { id: true, email: true, passwordHash: true },
    });

    expect(createdUser).not.toBeNull();

    if (!createdUser) {
      throw new Error('Registered user was not found');
    }

    expect(typeof createdUser.id).toBe('string');
    expect(createdUser.email).toBe(testUser.email);
    expect(typeof createdUser.passwordHash).toBe('string');
    expect(createdUser.passwordHash).not.toBe(testUser.password);

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

    const cookies = getCookies(loginResponse.headers['set-cookie']);

    expect(getCookieValue(cookies, ACCESS_TOKEN_COOKIE)).toBeDefined();
    expect(getCookieValue(cookies, REFRESH_TOKEN_COOKIE)).toBeDefined();

    await expect(
      prisma.session.count({ where: { userId: createdUser.id } }),
    ).resolves.toBe(1);

    const meResponse = await agent.get('/api/auth/me');

    expect(meResponse.status).toBe(200);
    const meBody = getBody<MeResponseBody>(meResponse.body);
    expect(meBody).toEqual({
      id: createdUser.id,
      email: testUser.email,
    });
  });
});
