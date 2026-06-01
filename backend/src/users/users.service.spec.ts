import { ConflictException } from '@nestjs/common';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import argon2 from 'argon2';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './users.dto';
import { GetUsersQueryDto } from './users.dto';
import { UsersService } from './users.service';

type PrismaMock = {
  user: {
    count: ReturnType<typeof jest.fn>;
    create: ReturnType<typeof jest.fn>;
    findMany: ReturnType<typeof jest.fn>;
    findUnique: ReturnType<typeof jest.fn>;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    user: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
}

function createService() {
  const prisma = createPrismaMock();
  const service = new UsersService(prisma as unknown as PrismaService);

  return { prisma, service };
}

function createQuery(
  overrides: Partial<GetUsersQueryDto> = {},
): GetUsersQueryDto {
  return Object.assign(new GetUsersQueryDto(), overrides);
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

function mockRandomUUID(value: string) {
  return jest
    .spyOn(crypto, 'randomUUID')
    .mockReturnValueOnce(value as ReturnType<typeof crypto.randomUUID>);
}

describe('UsersService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOAuthUser', () => {
    it('creates an OAuth user without a password hash', async () => {
      const { prisma, service } = createService();
      const id = '00000000-0000-4000-8000-000000000001';
      const user = createUser({ id, passwordHash: null });

      mockRandomUUID(id);
      prisma.user.create.mockResolvedValue(user);

      await expect(
        service.createOAuthUser({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
        }),
      ).resolves.toBe(user);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id,
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          passwordHash: null,
        },
      });
    });
  });

  describe('create', () => {
    it('creates a local user with a generated id and password hash', async () => {
      const { prisma, service } = createService();
      const id = '00000000-0000-4000-8000-000000000002';
      const user = createUser({ id });

      mockRandomUUID(id);
      prisma.user.create.mockResolvedValue(user);

      await expect(
        service.create({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          passwordHash: 'password-hash',
        }),
      ).resolves.toBe(user);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id,
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          passwordHash: 'password-hash',
        },
      });
    });
  });

  describe('findByEmail', () => {
    it('finds a user by email', async () => {
      const { prisma, service } = createService();
      const user = createUser();

      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.findByEmail('ada@example.com')).resolves.toBe(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'ada@example.com',
        },
      });
    });
  });

  describe('findById', () => {
    it('finds a user by id', async () => {
      const { prisma, service } = createService();
      const user = createUser();

      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.findById('user-1')).resolves.toBe(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
        },
      });
    });
  });

  describe('getUsers', () => {
    it('returns users with pagination metadata', async () => {
      const { prisma, service } = createService();
      const items = [
        {
          id: 'user-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ];

      prisma.user.findMany.mockResolvedValue(items);
      prisma.user.count.mockResolvedValue(3);

      await expect(
        service.getUsers(createQuery({ page: 2, limit: 2 })),
      ).resolves.toEqual({
        items,
        meta: {
          page: 2,
          limit: 2,
          total: 3,
          totalPages: 2,
        },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 2,
        take: 2,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    });

    it('builds a case-insensitive name and email search filter', async () => {
      const { prisma, service } = createService();
      const items = [
        {
          id: 'user-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ];

      prisma.user.findMany.mockResolvedValue(items);
      prisma.user.count.mockResolvedValue(1);

      await expect(
        service.getUsers(createQuery({ search: 'ada' })),
      ).resolves.toEqual({
        items,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'ada', mode: 'insensitive' } },
              { email: { contains: 'ada', mode: 'insensitive' } },
            ],
          },
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'ada', mode: 'insensitive' } },
            { email: { contains: 'ada', mode: 'insensitive' } },
          ],
        },
      });
    });
  });

  describe('createLocalUser', () => {
    it('rejects duplicate emails', async () => {
      const { prisma, service } = createService();
      const dto: CreateUserDto = {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'strong-password',
      };

      prisma.user.findUnique.mockResolvedValue(createUser());

      await expect(service.createLocalUser(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password, creates the user, and returns a user item', async () => {
      const { prisma, service } = createService();
      const id = '00000000-0000-4000-8000-000000000003';
      const dto: CreateUserDto = {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'strong-password',
      };
      const createdAt = new Date('2026-01-01T00:00:00.000Z');

      mockRandomUUID(id);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(
        createUser({
          id,
          name: dto.name,
          email: dto.email,
          createdAt,
        }),
      );

      await expect(service.createLocalUser(dto)).resolves.toEqual({
        id,
        name: dto.name,
        email: dto.email,
        createdAt,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: dto.email,
        },
      });
      expect(prisma.user.create).toHaveBeenCalledTimes(1);

      const createArg = prisma.user.create.mock.calls[0]?.[0] as {
        data: {
          id: string;
          email: string;
          name: string;
          password?: string;
          passwordHash: string;
        };
      };

      expect(createArg.data).toEqual({
        id,
        email: dto.email,
        name: dto.name,
        passwordHash: expect.any(String),
      });
      expect(createArg.data.password).toBeUndefined();
      await expect(
        argon2.verify(createArg.data.passwordHash, dto.password),
      ).resolves.toBe(true);
    });
  });
});
