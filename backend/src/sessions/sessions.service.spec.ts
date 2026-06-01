import { afterEach, describe, expect, it, jest } from '@jest/globals';
import argon2 from 'argon2';
import type { PrismaService } from '../prisma/prisma.service';
import { REFRESH_SESSION_TTL_MS, SessionsService } from './sessions.service';

type PrismaMock = {
  session: {
    create: ReturnType<typeof jest.fn>;
    delete: ReturnType<typeof jest.fn>;
    findUnique: ReturnType<typeof jest.fn>;
    update: ReturnType<typeof jest.fn>;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    session: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createService() {
  const prisma = createPrismaMock();
  const service = new SessionsService(prisma as unknown as PrismaService);

  return { prisma, service };
}

async function createSessionRecord(
  refreshToken: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: refreshToken.split('.')[0],
    userId: 'user-1',
    tokenHash: await argon2.hash(refreshToken),
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    expiresAt: new Date(Date.now() + REFRESH_SESSION_TTL_MS),
    revokedAt: null,
    ...overrides,
  };
}

describe('SessionsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createSession', () => {
    it('hashes the refresh token and stores a session with refresh TTL', async () => {
      const { prisma, service } = createService();
      const now = new Date('2026-06-01T09:00:00.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      const refreshToken = 'session-1.secret-1';

      await service.createSession({
        sessionId: 'session-1',
        userId: 'user-1',
        refreshToken,
      });

      expect(prisma.session.create).toHaveBeenCalledTimes(1);

      const createArg = prisma.session.create.mock.calls[0]?.[0] as {
        data: {
          id: string;
          userId: string;
          expiresAt: Date;
          tokenHash: string;
        };
      };

      expect(createArg.data).toEqual({
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(now + REFRESH_SESSION_TTL_MS),
        tokenHash: expect.any(String),
      });
      expect(createArg.data.tokenHash).not.toBe(refreshToken);
      await expect(
        argon2.verify(createArg.data.tokenHash, refreshToken),
      ).resolves.toBe(true);
    });
  });

  describe('deleteSession', () => {
    it('deletes a session by id', async () => {
      const { prisma, service } = createService();

      await service.deleteSession('session-1');

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });
  });

  describe('verifyToken', () => {
    it('returns the session when the refresh token is valid', async () => {
      const { prisma, service } = createService();
      const refreshToken = 'session-1.secret-1';
      const session = await createSessionRecord(refreshToken);

      prisma.session.findUnique.mockResolvedValue(session);

      await expect(service.verifyToken(refreshToken)).resolves.toBe(session);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });

    it('returns null when the session does not exist', async () => {
      const { prisma, service } = createService();

      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.verifyToken('missing-session.secret')).resolves.toBe(
        null,
      );
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'missing-session' },
      });
    });

    it('returns null when the refresh token does not match the stored hash', async () => {
      const { prisma, service } = createService();
      const session = await createSessionRecord('session-1.original-secret');

      prisma.session.findUnique.mockResolvedValue(session);

      await expect(
        service.verifyToken('session-1.different-secret'),
      ).resolves.toBe(null);
    });

    it('returns null when the session has been revoked', async () => {
      const { prisma, service } = createService();
      const refreshToken = 'session-1.secret-1';
      const session = await createSessionRecord(refreshToken, {
        revokedAt: new Date('2026-05-02T00:00:00.000Z'),
      });

      prisma.session.findUnique.mockResolvedValue(session);

      await expect(service.verifyToken(refreshToken)).resolves.toBe(null);
    });

    it('returns null when the session has expired', async () => {
      const { prisma, service } = createService();
      const refreshToken = 'session-1.secret-1';
      const session = await createSessionRecord(refreshToken, {
        expiresAt: new Date(Date.now() - 1),
      });

      prisma.session.findUnique.mockResolvedValue(session);

      await expect(service.verifyToken(refreshToken)).resolves.toBe(null);
    });
  });

  describe('rotateSession', () => {
    it('replaces the stored token hash and extends refresh TTL', async () => {
      const { prisma, service } = createService();
      const now = new Date('2026-06-01T09:00:00.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      const refreshToken = 'session-1.next-secret';

      await service.rotateSession('session-1', refreshToken);

      expect(prisma.session.update).toHaveBeenCalledTimes(1);

      const updateArg = prisma.session.update.mock.calls[0]?.[0] as {
        where: { id: string };
        data: {
          tokenHash: string;
          expiresAt: Date;
        };
      };

      expect(updateArg.where).toEqual({ id: 'session-1' });
      expect(updateArg.data.expiresAt).toEqual(
        new Date(now + REFRESH_SESSION_TTL_MS),
      );
      expect(updateArg.data.tokenHash).not.toBe(refreshToken);
      await expect(
        argon2.verify(updateArg.data.tokenHash, refreshToken),
      ).resolves.toBe(true);
    });
  });
});
