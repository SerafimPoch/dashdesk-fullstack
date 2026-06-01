import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { AccountProvider } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from './accounts.service';

type PrismaMock = {
  account: {
    create: ReturnType<typeof jest.fn>;
    findUnique: ReturnType<typeof jest.fn>;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    account: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
}

function createService() {
  const prisma = createPrismaMock();
  const service = new AccountsService(prisma as unknown as PrismaService);

  return { prisma, service };
}

function mockRandomUUID(value: string) {
  return jest
    .spyOn(crypto, 'randomUUID')
    .mockReturnValueOnce(value as ReturnType<typeof crypto.randomUUID>);
}

function createAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'account-1',
    userId: 'user-1',
    provider: AccountProvider.GOOGLE,
    providerAccountId: 'google-account-1',
    email: 'ada@example.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AccountsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOAuthAccount', () => {
    it('creates an OAuth account with a generated id and email', async () => {
      const { prisma, service } = createService();
      const id = '00000000-0000-4000-8000-000000000001';
      const account = createAccount({ id });

      mockRandomUUID(id);
      prisma.account.create.mockResolvedValue(account);

      await expect(
        service.createOAuthAccount({
          userId: 'user-1',
          provider: AccountProvider.GOOGLE,
          providerAccountId: 'google-account-1',
          email: 'ada@example.com',
        }),
      ).resolves.toBe(account);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          id,
          userId: 'user-1',
          provider: AccountProvider.GOOGLE,
          providerAccountId: 'google-account-1',
          email: 'ada@example.com',
        },
      });
    });

    it('creates an OAuth account when email is omitted', async () => {
      const { prisma, service } = createService();
      const id = '00000000-0000-4000-8000-000000000002';
      const account = createAccount({
        id,
        provider: AccountProvider.MICROSOFT,
        providerAccountId: 'microsoft-account-1',
        email: null,
      });

      mockRandomUUID(id);
      prisma.account.create.mockResolvedValue(account);

      await expect(
        service.createOAuthAccount({
          userId: 'user-1',
          provider: AccountProvider.MICROSOFT,
          providerAccountId: 'microsoft-account-1',
        }),
      ).resolves.toBe(account);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          id,
          userId: 'user-1',
          provider: AccountProvider.MICROSOFT,
          providerAccountId: 'microsoft-account-1',
          email: undefined,
        },
      });
    });
  });

  describe('findByProviderAccount', () => {
    it('finds an OAuth account by provider and provider account id with user included', async () => {
      const { prisma, service } = createService();
      const account = createAccount({
        user: {
          id: 'user-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          passwordHash: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      });

      prisma.account.findUnique.mockResolvedValue(account);

      await expect(
        service.findByProviderAccount(
          AccountProvider.GOOGLE,
          'google-account-1',
        ),
      ).resolves.toBe(account);
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: AccountProvider.GOOGLE,
            providerAccountId: 'google-account-1',
          },
        },
        include: {
          user: true,
        },
      });
    });
  });
});
