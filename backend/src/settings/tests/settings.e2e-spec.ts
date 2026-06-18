import type { INestApplication } from '@nestjs/common';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../auth/auth-cookie';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createHttpAgent,
  createSettingsE2eApp,
  createSettingsTestUser,
  deleteUserByEmail,
  getBody,
  getCookies,
  loginSettingsTestUser,
  type ErrorResponseBody,
} from './settings-e2e.helpers';

function parseBinaryResponse(
  response: NodeJS.ReadableStream,
  callback: (error: Error | null, body?: Buffer) => void,
) {
  const chunks: Buffer[] = [];

  response.on('data', (chunk: Buffer) => chunks.push(chunk));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
  response.on('error', callback);
}

interface AvatarUploadResponseBody {
  url: string;
  mimeType: string;
  size: number;
  data?: unknown;
}

interface SettingsResponseBody {
  profile: {
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    phoneNumber: string | null;
    address: string | null;
    avatar: AvatarUploadResponseBody | null;
  };
  account: {
    email: string;
    hasPassword: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
  };
}

describe('Settings e2e', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Settings User',
    email: `settings-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  const conflictUser = {
    name: 'E2E Settings Conflict User',
    email: `settings-conflict-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    const e2eApp = await createSettingsE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;

    const createdUser = await createSettingsTestUser(prisma, testUser);
    createdUserId = createdUser.id;
    await createSettingsTestUser(prisma, conflictUser);
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await deleteUserByEmail(prisma, 'settings-password-next@example.com');
    await deleteUserByEmail(prisma, conflictUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('rejects unauthenticated settings requests', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = createHttpAgent(app);

    await expect(agent.get('/api/settings')).resolves.toMatchObject({
      status: 401,
    });
    await expect(
      agent.patch('/api/settings/profile').send({ firstName: 'Ada' }),
    ).resolves.toMatchObject({
      status: 401,
    });
    await expect(
      agent.patch('/api/settings/account').send({ email: 'next@example.com' }),
    ).resolves.toMatchObject({
      status: 401,
    });
    await expect(
      agent.patch('/api/settings/security').send({ twoFactorEnabled: true }),
    ).resolves.toMatchObject({
      status: 401,
    });
    await expect(agent.get('/api/settings/avatar')).resolves.toMatchObject({
      status: 401,
    });
    await expect(
      agent.delete('/api/settings/account').send({
        confirmEmail: testUser.email,
      }),
    ).resolves.toMatchObject({
      status: 401,
    });
  });

  it('returns current settings and 404 for a missing avatar', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginSettingsTestUser(app, testUser);

    const settingsResponse = await agent.get('/api/settings');

    expect(settingsResponse.status).toBe(200);
    expect(getBody<SettingsResponseBody>(settingsResponse.body)).toEqual({
      profile: {
        firstName: 'E2E',
        lastName: 'Settings User',
        dateOfBirth: null,
        phoneNumber: null,
        address: null,
        avatar: null,
      },
      account: {
        email: testUser.email,
        hasPassword: true,
      },
      security: {
        twoFactorEnabled: false,
      },
    });

    await expect(agent.get('/api/settings/avatar')).resolves.toMatchObject({
      status: 404,
    });
  });

  it('validates and updates profile settings', async () => {
    if (!app || !prisma || !createdUserId) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginSettingsTestUser(app, testUser);

    const invalidResponse = await agent.patch('/api/settings/profile').send({
      dateOfBirth: '2026-02-31',
      phoneNumber: '1',
    });

    expect(invalidResponse.status).toBe(400);
    expect(getBody<ErrorResponseBody>(invalidResponse.body).statusCode).toBe(
      400,
    );

    const response = await agent.patch('/api/settings/profile').send({
      firstName: 'Grace',
      lastName: 'Hopper',
      dateOfBirth: '1906-12-09',
      phoneNumber: '+1283716291',
      address: '323 Fifth Ave. Canandaigua, NY',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      firstName: 'Grace',
      lastName: 'Hopper',
      dateOfBirth: '1906-12-09',
      phoneNumber: '+1283716291',
      address: '323 Fifth Ave. Canandaigua, NY',
      avatar: null,
    });
    await expect(
      prisma.user.findUnique({
        where: { id: createdUserId },
        select: {
          name: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          phoneNumber: true,
          address: true,
        },
      }),
    ).resolves.toMatchObject({
      name: 'Grace Hopper',
      firstName: 'Grace',
      lastName: 'Hopper',
      dateOfBirth: new Date('1906-12-09T00:00:00.000Z'),
      phoneNumber: '+1283716291',
      address: '323 Fifth Ave. Canandaigua, NY',
    });
  });

  it('rejects conflicting account changes and accepts a password change', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginSettingsTestUser(app, testUser);

    const noChangesResponse = await agent.patch('/api/settings/account').send({
      currentPassword: testUser.password,
    });

    expect(noChangesResponse.status).toBe(400);
    expect(getBody<ErrorResponseBody>(noChangesResponse.body)).toMatchObject({
      message: 'No account changes were provided',
      error: 'Bad Request',
      statusCode: 400,
    });

    const conflictResponse = await agent.patch('/api/settings/account').send({
      email: conflictUser.email,
      currentPassword: testUser.password,
    });

    expect(conflictResponse.status).toBe(409);
    expect(getBody<ErrorResponseBody>(conflictResponse.body)).toMatchObject({
      message: 'User with this email already exists',
      error: 'Conflict',
      statusCode: 409,
    });

    const invalidPasswordResponse = await agent
      .patch('/api/settings/account')
      .send({
        email: 'settings-password-next@example.com',
        currentPassword: 'WrongPass123',
      });

    expect(invalidPasswordResponse.status).toBe(401);

    const updateResponse = await agent.patch('/api/settings/account').send({
      email: 'settings-password-next@example.com',
      currentPassword: testUser.password,
      newPassword: 'NextPass123',
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual({
      email: 'settings-password-next@example.com',
      hasPassword: true,
    });

    const oldLogin = await createHttpAgent(app).post('/api/auth/login').send({
      email: 'settings-password-next@example.com',
      password: testUser.password,
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await createHttpAgent(app).post('/api/auth/login').send({
      email: 'settings-password-next@example.com',
      password: 'NextPass123',
    });
    expect(newLogin.status).toBe(201);
  });

  it('uploads avatar bytes and serves them from the avatar endpoint', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginSettingsTestUser(app, {
      ...testUser,
      email: 'settings-password-next@example.com',
      password: 'NextPass123',
    });
    const avatarBytes = Buffer.from('avatar-binary');

    const missingFileResponse = await agent.post('/api/settings/avatar');

    expect(missingFileResponse.status).toBe(400);
    expect(getBody<ErrorResponseBody>(missingFileResponse.body)).toMatchObject({
      message: 'Avatar file is required',
      error: 'Bad Request',
      statusCode: 400,
    });

    const invalidMimeResponse = await agent
      .post('/api/settings/avatar')
      .attach('file', Buffer.from('not-an-image'), {
        filename: 'avatar.txt',
        contentType: 'text/plain',
      });

    expect(invalidMimeResponse.status).toBe(400);
    expect(getBody<ErrorResponseBody>(invalidMimeResponse.body)).toMatchObject({
      message: 'Avatar must be a PNG, JPG, or WebP image',
      error: 'Bad Request',
      statusCode: 400,
    });

    const uploadResponse = await agent
      .post('/api/settings/avatar')
      .attach('file', avatarBytes, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(uploadResponse.status).toBe(201);
    const uploadBody = getBody<AvatarUploadResponseBody>(uploadResponse.body);
    expect(uploadBody).toMatchObject({
      url: '/api/settings/avatar',
      mimeType: 'image/png',
      size: avatarBytes.length,
    });
    expect(uploadBody.data).toBeUndefined();

    const avatarResponse = await agent
      .get('/api/settings/avatar')
      .buffer(true)
      .parse(
        parseBinaryResponse as (
          response: unknown,
          callback: (error: Error | null, body?: Buffer) => void,
        ) => void,
      );

    expect(avatarResponse.status).toBe(200);
    expect(avatarResponse.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(avatarResponse.body as Buffer, avatarBytes)).toBe(0);

    const settingsResponse = await agent.get('/api/settings');

    expect(settingsResponse.status).toBe(200);
    expect(
      getBody<SettingsResponseBody>(settingsResponse.body).profile.avatar,
    ).toMatchObject({
      url: '/api/settings/avatar',
      mimeType: 'image/png',
      size: avatarBytes.length,
    });
  });

  it('persists the security 2FA flag', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginSettingsTestUser(app, {
      ...testUser,
      email: 'settings-password-next@example.com',
      password: 'NextPass123',
    });

    const response = await agent.patch('/api/settings/security').send({
      twoFactorEnabled: true,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      twoFactorEnabled: true,
    });

    const settingsResponse = await agent.get('/api/settings');

    expect(settingsResponse.status).toBe(200);
    expect(
      getBody<SettingsResponseBody>(settingsResponse.body).security,
    ).toEqual({
      twoFactorEnabled: true,
    });
  });

  it('hard deletes the account, clears cookies, and cascades owned rows', async () => {
    if (!app || !prisma) {
      throw new Error('E2E app was not initialized');
    }

    const deleteUser = {
      name: 'E2E Settings Delete User',
      email: `settings-delete-e2e-${Date.now()}@example.com`,
      password: 'StrongPass123',
    };
    const createdUser = await createSettingsTestUser(prisma, deleteUser);

    await prisma.schedule.create({
      data: {
        userId: createdUser.id,
        title: 'Delete cascade review',
        startsAt: new Date('2026-05-28T09:00:00.000Z'),
        endsAt: new Date('2026-05-28T10:00:00.000Z'),
        location: 'Conference Room',
      },
    });

    const agent = await loginSettingsTestUser(app, deleteUser);
    await expect(
      prisma.session.count({ where: { userId: createdUser.id } }),
    ).resolves.toBe(1);

    const response = await agent.delete('/api/settings/account').send({
      confirmEmail: deleteUser.email,
      currentPassword: deleteUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Account deleted successfully',
    });
    const cookies = getCookies(response.headers['set-cookie']);
    expect(
      cookies.some((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=;`)),
    ).toBe(true);
    expect(
      cookies.some((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE}=;`)),
    ).toBe(true);
    await expect(
      prisma.user.findUnique({ where: { id: createdUser.id } }),
    ).resolves.toBeNull();
    await expect(
      prisma.schedule.count({ where: { userId: createdUser.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.session.count({ where: { userId: createdUser.id } }),
    ).resolves.toBe(0);
  });
});
