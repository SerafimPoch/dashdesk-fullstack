import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createTransactionTestUser,
  createTransactionsE2eApp,
  deleteUserByEmail,
  getBody,
  loginTransactionTestUser,
  seedTransaction,
  type TransactionsListDto,
} from './transactions-e2e.helpers';

describe('Transactions e2e: filters and pagination', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;

  const testUser = {
    name: 'E2E Transactions Filters User',
    email: `transactions-filters-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };
  const otherUser = {
    name: 'E2E Other Transactions User',
    email: `transactions-other-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    const e2eApp = await createTransactionsE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;

    const createdUser = await createTransactionTestUser(prisma, testUser);
    const createdOtherUser = await createTransactionTestUser(prisma, otherUser);

    await seedTransaction(prisma, createdUser.id, {
      name: 'Ada Lovelace',
      email: 'ada.customer@example.com',
      product: 'Dashdesk Pro',
      quantity: 3,
      totalCents: 12000,
      date: '2026-05-20',
    });
    await seedTransaction(prisma, createdUser.id, {
      name: 'Grace Hopper',
      email: 'grace.customer@example.com',
      product: 'Analytics Suite',
      quantity: 9,
      totalCents: 45000,
      date: '2026-06-02',
    });
    await seedTransaction(prisma, createdUser.id, {
      name: 'Linus Torvalds',
      email: 'linus.customer@example.com',
      product: 'Dashdesk Basic',
      quantity: 1,
      totalCents: 2500,
      date: '2026-04-15',
    });
    await seedTransaction(prisma, createdOtherUser.id, {
      name: 'Ada Other',
      email: 'ada.other@example.com',
      product: 'Dashdesk Pro',
      quantity: 3,
      totalCents: 12000,
      date: '2026-05-20',
    });
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await deleteUserByEmail(prisma, otherUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('lists only the current user transactions with pagination metadata', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginTransactionTestUser(app, testUser);

    const response = await agent.get('/api/transactions').query({
      page: 2,
      limit: 1,
    });

    expect(response.status).toBe(200);
    const body = getBody<TransactionsListDto>(response.body);

    expect(body).toEqual({
      items: [
        expect.objectContaining({
          name: 'Ada Lovelace',
          email: 'ada.customer@example.com',
          product: 'Dashdesk Pro',
          quantity: '3 pcs',
          total: '$120',
        }) as TransactionsListDto['items'][number],
      ],
      meta: {
        page: 2,
        limit: 1,
        total: 3,
        totalPages: 3,
      },
    });
  });

  it('applies search, product, date, quantity, and total filters', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginTransactionTestUser(app, testUser);

    const searchResponse = await agent.get('/api/transactions').query({
      search: 'grace',
    });

    expect(searchResponse.status).toBe(200);
    expect(getBody<TransactionsListDto>(searchResponse.body)).toMatchObject({
      items: [
        {
          name: 'Grace Hopper',
          email: 'grace.customer@example.com',
          product: 'Analytics Suite',
          quantity: '9 pcs',
          total: '$450',
        },
      ],
      meta: {
        total: 1,
      },
    });

    const filteredResponse = await agent.get('/api/transactions').query({
      product: 'dashdesk',
      from: '2026-05-01',
      to: '2026-05-31',
      minQuantity: 2,
      maxQuantity: 5,
      minTotalCents: 10000,
      maxTotalCents: 15000,
    });

    expect(filteredResponse.status).toBe(200);
    expect(getBody<TransactionsListDto>(filteredResponse.body)).toMatchObject({
      items: [
        {
          name: 'Ada Lovelace',
          email: 'ada.customer@example.com',
          product: 'Dashdesk Pro',
          quantity: '3 pcs',
          total: '$120',
        },
      ],
      meta: {
        total: 1,
      },
    });
  });
});
