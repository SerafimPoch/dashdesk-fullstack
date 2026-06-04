import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import type {
  TransactionDateRangesDto,
  TransactionItemDto,
  TransactionsListDto,
} from '../transactions.dto';
import {
  createAuthE2eApp,
  createHttpAgent,
  createPasswordUser,
  deleteUserByEmail,
  getBody,
  getCookies,
  getCookieValue,
  type ErrorResponseBody,
  type LoginResponseBody,
} from '../../auth/tests/auth-e2e.helpers';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../auth/auth-cookie';

export {
  createAuthE2eApp as createTransactionsE2eApp,
  createHttpAgent,
  deleteUserByEmail,
  getBody,
  type ErrorResponseBody,
  type TransactionDateRangesDto,
  type TransactionItemDto,
  type TransactionsListDto,
};

export interface TransactionTestUser {
  name: string;
  email: string;
  password: string;
}

export interface TransactionSeed {
  name: string;
  email: string;
  product: string;
  quantity: number;
  totalCents: number;
  date: string;
}

export async function createTransactionTestUser(
  prisma: PrismaService,
  user: TransactionTestUser,
) {
  await deleteUserByEmail(prisma, user.email);

  return createPasswordUser(prisma, user);
}

export async function loginTransactionTestUser(
  app: INestApplication,
  user: TransactionTestUser,
) {
  const agent = createHttpAgent(app);
  const response = await agent.post('/api/auth/login').send({
    email: user.email,
    password: user.password,
  });

  expect(response.status).toBe(201);
  const body = getBody<LoginResponseBody>(response.body);
  expect(body).toEqual({
    message: 'User logged in successfully',
    user: {
      email: user.email,
    },
  });

  const cookies = getCookies(response.headers['set-cookie']);
  expect(getCookieValue(cookies, ACCESS_TOKEN_COOKIE)).toBeDefined();
  expect(getCookieValue(cookies, REFRESH_TOKEN_COOKIE)).toBeDefined();

  return agent;
}

export async function seedTransaction(
  prisma: PrismaService,
  userId: string,
  data: TransactionSeed,
) {
  return prisma.transaction.create({
    data: {
      userId,
      name: data.name,
      email: data.email,
      product: data.product,
      quantity: data.quantity,
      totalCents: data.totalCents,
      date: new Date(`${data.date}T00:00:00.000Z`),
    },
    select: {
      id: true,
      name: true,
      email: true,
      product: true,
      quantity: true,
      totalCents: true,
      date: true,
    },
  });
}
