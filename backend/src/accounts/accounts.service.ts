import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { AccountProvider } from '@prisma/client';

interface OAuthAccount {
  userId: string;
  provider: AccountProvider;
  providerAccountId: string;
  email?: string;
}

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOAuthAccount({
    userId,
    provider,
    providerAccountId,
    email,
  }: OAuthAccount) {
    const id = crypto.randomUUID();

    const account = await this.prisma.account.create({
      data: {
        id,
        userId,
        provider,
        providerAccountId,
        email,
      },
    });

    return account;
  }

  async findByProviderAccount(
    provider: AccountProvider,
    providerAccountId: string,
  ) {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });

    return account;
  }
}
