import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, jest, afterEach } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { AccountProvider } from '@prisma/client';
import argon2 from 'argon2';
import { AccountsService } from '../accounts/accounts.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { RegisterDto } from './register.dto';

type MockFn = ReturnType<typeof jest.fn>;

type UsersServiceMock = {
  create: MockFn;
  createOAuthUser: MockFn;
  findByEmail: MockFn;
  findById: MockFn;
};

type JwtServiceMock = {
  sign: MockFn;
};

type SessionsServiceMock = {
  createSession: MockFn;
  deleteSession: MockFn;
  rotateSession: MockFn;
  verifyToken: MockFn;
};

type AccountsServiceMock = {
  createOAuthAccount: MockFn;
  findByProviderAccount: MockFn;
};

function createService() {
  const users: UsersServiceMock = {
    create: jest.fn(),
    createOAuthUser: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };
  const jwt: JwtServiceMock = {
    sign: jest.fn(() => 'access-token'),
  };
  const sessions: SessionsServiceMock = {
    createSession: jest.fn(),
    deleteSession: jest.fn(),
    rotateSession: jest.fn(),
    verifyToken: jest.fn(),
  };
  const accounts: AccountsServiceMock = {
    createOAuthAccount: jest.fn(),
    findByProviderAccount: jest.fn(),
  };
  const service = new AuthService(
    users as unknown as UsersService,
    jwt as unknown as JwtService,
    sessions as unknown as SessionsService,
    accounts as unknown as AccountsService,
  );

  return { accounts, jwt, service, sessions, users };
}

function mockRandomUUID(...values: string[]) {
  const spy = jest.spyOn(crypto, 'randomUUID');

  values.forEach((value) => {
    spy.mockReturnValueOnce(value as ReturnType<typeof crypto.randomUUID>);
  });

  return spy;
}

function createUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    passwordHash: 'password-hash',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('creates a local user with a hashed password', async () => {
      const { service, users } = createService();
      const dto: RegisterDto = {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'strong-password',
      };

      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue(
        createUser({ email: dto.email, name: dto.name }),
      );

      await expect(service.register(dto)).resolves.toEqual({
        message:
          'User Ada Lovelace with ada@example.com was successfully created',
      });

      expect(users.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(users.create).toHaveBeenCalledTimes(1);

      const createArg = users.create.mock.calls[0]?.[0] as {
        name: string;
        email: string;
        passwordHash: string;
        password?: string;
      };

      expect(createArg).toEqual({
        name: dto.name,
        email: dto.email,
        passwordHash: expect.any(String),
      });
      expect(createArg.password).toBeUndefined();
      await expect(
        argon2.verify(createArg.passwordHash, dto.password),
      ).resolves.toBe(true);
    });

    it('rejects duplicate emails', async () => {
      const { service, users } = createService();
      const dto: RegisterDto = {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'strong-password',
      };

      users.findByEmail.mockResolvedValue(createUser());

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('signs an access token, creates a refresh session, and returns auth data', async () => {
      const { jwt, service, sessions } = createService();
      const sessionId = '00000000-0000-4000-8000-000000000001';
      const secret = '00000000-0000-4000-8000-000000000002';

      mockRandomUUID(sessionId, secret);

      await expect(
        service.login({ id: 'user-1', email: 'ada@example.com' }),
      ).resolves.toEqual({
        message: 'User logged in successfully',
        accessToken: 'access-token',
        refreshToken: `${sessionId}.${secret}`,
        user: {
          email: 'ada@example.com',
        },
      });

      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'ada@example.com',
      });
      expect(sessions.createSession).toHaveBeenCalledWith({
        sessionId,
        userId: 'user-1',
        refreshToken: `${sessionId}.${secret}`,
      });
    });
  });

  describe('loginWithOAuthProfile', () => {
    it('logs in the linked account user when an OAuth account exists', async () => {
      const { accounts, service, sessions, users } = createService();
      const sessionId = '00000000-0000-4000-8000-000000000003';
      const secret = '00000000-0000-4000-8000-000000000004';
      const user = createUser({ id: 'oauth-user-1' });

      mockRandomUUID(sessionId, secret);
      accounts.findByProviderAccount.mockResolvedValue({ user });

      await expect(
        service.loginWithOAuthProfile({
          provider: AccountProvider.GOOGLE,
          providerAccountId: 'google-1',
          email: 'ada@example.com',
          name: 'Ada Lovelace',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          accessToken: 'access-token',
          refreshToken: `${sessionId}.${secret}`,
        }),
      );

      expect(users.findByEmail).not.toHaveBeenCalled();
      expect(accounts.createOAuthAccount).not.toHaveBeenCalled();
      expect(sessions.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'oauth-user-1',
        }),
      );
    });

    it('links an existing user when an OAuth account does not exist', async () => {
      const { accounts, service, users } = createService();
      const existingUser = createUser({ id: 'existing-user-1' });

      mockRandomUUID(
        '00000000-0000-4000-8000-000000000005',
        '00000000-0000-4000-8000-000000000006',
      );
      accounts.findByProviderAccount.mockResolvedValue(null);
      users.findByEmail.mockResolvedValue(existingUser);

      await service.loginWithOAuthProfile({
        provider: AccountProvider.MICROSOFT,
        providerAccountId: 'microsoft-1',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
      });

      expect(accounts.createOAuthAccount).toHaveBeenCalledWith({
        userId: 'existing-user-1',
        provider: AccountProvider.MICROSOFT,
        providerAccountId: 'microsoft-1',
        email: 'ada@example.com',
      });
      expect(users.createOAuthUser).not.toHaveBeenCalled();
    });

    it('creates a new OAuth user and links the account when no user exists', async () => {
      const { accounts, service, users } = createService();
      const createdUser = createUser({ id: 'created-oauth-user-1' });

      mockRandomUUID(
        '00000000-0000-4000-8000-000000000007',
        '00000000-0000-4000-8000-000000000008',
      );
      accounts.findByProviderAccount.mockResolvedValue(null);
      users.findByEmail.mockResolvedValue(null);
      users.createOAuthUser.mockResolvedValue(createdUser);

      await service.loginWithOAuthProfile({
        provider: AccountProvider.GOOGLE,
        providerAccountId: 'google-1',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
      });

      expect(users.createOAuthUser).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      });
      expect(accounts.createOAuthAccount).toHaveBeenCalledWith({
        userId: 'created-oauth-user-1',
        provider: AccountProvider.GOOGLE,
        providerAccountId: 'google-1',
        email: 'ada@example.com',
      });
    });
  });

  describe('refresh', () => {
    it('rotates a valid refresh token and returns a new access token', async () => {
      const { jwt, service, sessions, users } = createService();
      const nextSecret = '00000000-0000-4000-8000-000000000009';

      mockRandomUUID(nextSecret);
      sessions.verifyToken.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
      });
      users.findById.mockResolvedValue(createUser());

      await expect(service.refresh('session-1.secret-1')).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: `session-1.${nextSecret}`,
      });

      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'ada@example.com',
      });
      expect(sessions.rotateSession).toHaveBeenCalledWith(
        'session-1',
        `session-1.${nextSecret}`,
      );
    });

    it('rejects refresh when the session token is invalid', async () => {
      const { service, sessions, users } = createService();

      sessions.verifyToken.mockResolvedValue(null);

      await expect(
        service.refresh('session-1.secret-1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(users.findById).not.toHaveBeenCalled();
    });

    it('rejects refresh when the session user no longer exists', async () => {
      const { service, sessions, users } = createService();

      sessions.verifyToken.mockResolvedValue({
        id: 'session-1',
        userId: 'missing-user',
      });
      users.findById.mockResolvedValue(null);

      await expect(service.refresh('session-1.secret-1')).rejects.toThrow(
        'User does not exist',
      );
      expect(sessions.rotateSession).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('deletes the session for a valid refresh token', async () => {
      const { service, sessions } = createService();

      sessions.verifyToken.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
      });

      await expect(
        service.logout('session-1.secret-1'),
      ).resolves.toBeUndefined();
      expect(sessions.deleteSession).toHaveBeenCalledWith('session-1');
    });

    it('rejects logout when the refresh token is invalid', async () => {
      const { service, sessions } = createService();

      sessions.verifyToken.mockResolvedValue(null);

      await expect(service.logout('session-1.secret-1')).rejects.toThrow(
        'No registered session',
      );
      expect(sessions.deleteSession).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('returns null when the user does not exist', async () => {
      const { service, users } = createService();

      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('ada@example.com', 'strong-password'),
      ).resolves.toBe(null);
    });

    it('returns null for OAuth users without a password hash', async () => {
      const { service, users } = createService();

      users.findByEmail.mockResolvedValue(createUser({ passwordHash: null }));

      await expect(
        service.validateUser('ada@example.com', 'strong-password'),
      ).resolves.toBe(null);
    });

    it('returns null when the password is invalid', async () => {
      const { service, users } = createService();
      const passwordHash = await argon2.hash('correct-password');

      users.findByEmail.mockResolvedValue(createUser({ passwordHash }));

      await expect(
        service.validateUser('ada@example.com', 'wrong-password'),
      ).resolves.toBe(null);
    });

    it('returns the authenticated user when the password is valid', async () => {
      const { service, users } = createService();
      const passwordHash = await argon2.hash('correct-password');

      users.findByEmail.mockResolvedValue(createUser({ passwordHash }));

      await expect(
        service.validateUser('ada@example.com', 'correct-password'),
      ).resolves.toEqual({
        id: 'user-1',
        email: 'ada@example.com',
      });
    });
  });
});
