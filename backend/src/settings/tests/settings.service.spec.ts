import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import argon2 from 'argon2';
import type { PrismaService } from '../../prisma/prisma.service';
import type {
  DeleteAccountDto,
  UpdateAccountDto,
  UpdateProfileDto,
  UploadedAvatarFile,
} from '../settings.dto';
import { SettingsService } from '../settings.service';

type PrismaMock = {
  user: {
    delete: ReturnType<typeof jest.fn>;
    findUnique: ReturnType<typeof jest.fn>;
    update: ReturnType<typeof jest.fn>;
  };
  userAvatar: {
    findUnique: ReturnType<typeof jest.fn>;
    upsert: ReturnType<typeof jest.fn>;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    user: {
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userAvatar: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
}

function createService() {
  const prisma = createPrismaMock();
  const service = new SettingsService(prisma as unknown as PrismaService);

  return { prisma, service };
}

function createUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Ada Lovelace',
    firstName: null,
    lastName: null,
    email: 'ada@example.com',
    passwordHash: 'password-hash',
    dateOfBirth: null,
    phoneNumber: null,
    address: null,
    twoFactorEnabled: false,
    avatar: null,
    ...overrides,
  };
}

describe('SettingsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getSettings', () => {
    it('returns settings without avatar bytes', async () => {
      const { prisma, service } = createService();

      prisma.user.findUnique.mockResolvedValue(
        createUser({
          dateOfBirth: new Date('1815-12-10T00:00:00.000Z'),
          phoneNumber: '+1234567890',
          address: 'London',
          avatar: {
            mimeType: 'image/png',
            size: 12,
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        }),
      );

      await expect(service.getSettings('user-1')).resolves.toEqual({
        profile: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          dateOfBirth: '1815-12-10',
          phoneNumber: '+1234567890',
          address: 'London',
          avatar: {
            url: '/api/settings/avatar',
            mimeType: 'image/png',
            size: 12,
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        },
        account: {
          email: 'ada@example.com',
          hasPassword: true,
        },
        security: {
          twoFactorEnabled: false,
        },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            avatar: {
              select: {
                mimeType: true,
                size: true,
                updatedAt: true,
              },
            },
          }),
        }),
      );
    });

    it('uses null fallback names for an empty display name', async () => {
      const { prisma, service } = createService();

      prisma.user.findUnique.mockResolvedValue(
        createUser({
          name: '   ',
        }),
      );

      await expect(service.getSettings('user-1')).resolves.toMatchObject({
        profile: {
          firstName: null,
          lastName: null,
          avatar: null,
        },
      });
    });

    it('uses a single display-name part as first name only', async () => {
      const { prisma, service } = createService();

      prisma.user.findUnique.mockResolvedValue(
        createUser({
          name: 'Ada',
        }),
      );

      await expect(service.getSettings('user-1')).resolves.toMatchObject({
        profile: {
          firstName: 'Ada',
          lastName: null,
          avatar: null,
        },
      });
    });

    it('prefers stored profile names over display-name fallback', async () => {
      const { prisma, service } = createService();

      prisma.user.findUnique.mockResolvedValue(
        createUser({
          name: 'Ignored Fallback',
          firstName: 'Grace',
          lastName: 'Hopper',
        }),
      );

      await expect(service.getSettings('user-1')).resolves.toMatchObject({
        profile: {
          firstName: 'Grace',
          lastName: 'Hopper',
          avatar: null,
        },
      });
    });
  });

  describe('updateProfile', () => {
    it('updates profile fields and syncs the display name', async () => {
      const { prisma, service } = createService();
      const dto: UpdateProfileDto = {
        firstName: 'Grace',
        lastName: 'Hopper',
        dateOfBirth: '1906-12-09',
        phoneNumber: '+1283716291',
        address: '323 Fifth Ave. Canandaigua, NY',
      };

      prisma.user.findUnique.mockResolvedValue(createUser());
      prisma.user.update.mockResolvedValue(
        createUser({
          name: 'Grace Hopper',
          firstName: 'Grace',
          lastName: 'Hopper',
          dateOfBirth: new Date('1906-12-09T00:00:00.000Z'),
          phoneNumber: dto.phoneNumber,
          address: dto.address,
        }),
      );

      await expect(service.updateProfile('user-1', dto)).resolves.toMatchObject(
        {
          firstName: 'Grace',
          lastName: 'Hopper',
          dateOfBirth: '1906-12-09',
          phoneNumber: dto.phoneNumber,
          address: dto.address,
        },
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            firstName: 'Grace',
            lastName: 'Hopper',
            dateOfBirth: new Date('1906-12-09T00:00:00.000Z'),
            phoneNumber: dto.phoneNumber,
            address: dto.address,
            name: 'Grace Hopper',
          },
        }),
      );
    });
  });

  describe('updateAccount', () => {
    it('rejects duplicate emails', async () => {
      const { prisma, service } = createService();
      const passwordHash = await argon2.hash('CurrentPass123');
      const dto: UpdateAccountDto = {
        email: 'duplicate@example.com',
        currentPassword: 'CurrentPass123',
      };

      prisma.user.findUnique
        .mockResolvedValueOnce(createUser({ passwordHash }))
        .mockResolvedValueOnce({ id: 'user-2' });

      await expect(service.updateAccount('user-1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects an invalid current password', async () => {
      const { prisma, service } = createService();
      const passwordHash = await argon2.hash('CurrentPass123');
      const dto: UpdateAccountDto = {
        email: 'next@example.com',
        currentPassword: 'WrongPass123',
      };

      prisma.user.findUnique.mockResolvedValue(createUser({ passwordHash }));

      await expect(service.updateAccount('user-1', dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('hashes and stores a new password', async () => {
      const { prisma, service } = createService();
      const passwordHash = await argon2.hash('CurrentPass123');
      const dto: UpdateAccountDto = {
        currentPassword: 'CurrentPass123',
        newPassword: 'NextPass123',
      };

      prisma.user.findUnique.mockResolvedValue(createUser({ passwordHash }));
      prisma.user.update.mockResolvedValue(
        createUser({ passwordHash: 'next-password-hash' }),
      );

      await expect(service.updateAccount('user-1', dto)).resolves.toEqual({
        email: 'ada@example.com',
        hasPassword: true,
      });

      const updateArg = prisma.user.update.mock.calls[0]?.[0] as {
        data: {
          passwordHash: string;
          password?: string;
        };
      };

      expect(updateArg.data.password).toBeUndefined();
      expect(updateArg.data.passwordHash).toEqual(expect.any(String));
      await expect(
        argon2.verify(updateArg.data.passwordHash, dto.newPassword ?? ''),
      ).resolves.toBe(true);
    });
  });

  describe('updateSecurity', () => {
    it('persists the 2FA flag', async () => {
      const { prisma, service } = createService();

      prisma.user.update.mockResolvedValue({ twoFactorEnabled: true });

      await expect(
        service.updateSecurity('user-1', { twoFactorEnabled: true }),
      ).resolves.toEqual({
        twoFactorEnabled: true,
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          twoFactorEnabled: true,
        },
        select: {
          twoFactorEnabled: true,
        },
      });
    });
  });

  describe('uploadAvatar', () => {
    it('upserts avatar bytes and returns metadata', async () => {
      const { prisma, service } = createService();
      const updatedAt = new Date('2026-01-01T00:00:00.000Z');
      const file: UploadedAvatarFile = {
        buffer: Buffer.from('avatar'),
        mimetype: 'image/png',
        size: 6,
        originalname: 'avatar.png',
      };
      const avatarData = Uint8Array.from(file.buffer);

      prisma.userAvatar.upsert.mockResolvedValue({
        mimeType: 'image/png',
        size: 6,
        updatedAt,
      });

      await expect(service.uploadAvatar('user-1', file)).resolves.toEqual({
        url: '/api/settings/avatar',
        mimeType: 'image/png',
        size: 6,
        updatedAt,
      });
      expect(prisma.userAvatar.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: {
          userId: 'user-1',
          mimeType: 'image/png',
          size: 6,
          data: avatarData,
        },
        update: {
          mimeType: 'image/png',
          size: 6,
          data: avatarData,
        },
        select: {
          mimeType: true,
          size: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('deleteAccount', () => {
    it('verifies the password and hard deletes the user', async () => {
      const { prisma, service } = createService();
      const passwordHash = await argon2.hash('CurrentPass123');
      const dto: DeleteAccountDto = {
        confirmEmail: 'ada@example.com',
        currentPassword: 'CurrentPass123',
      };

      prisma.user.findUnique.mockResolvedValue(
        createUser({
          passwordHash,
        }),
      );
      prisma.user.delete.mockResolvedValue(createUser());

      await expect(service.deleteAccount('user-1', dto)).resolves.toBe(
        undefined,
      );
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });
});
