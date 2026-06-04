import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createTransactionTestUser,
  createTransactionsE2eApp,
  deleteUserByEmail,
  getBody,
  loginTransactionTestUser,
  type TransactionDateRangesDto,
} from './transactions-e2e.helpers';

describe('Transactions e2e: date ranges', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Transactions Date Ranges User',
    email: `transactions-ranges-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    const e2eApp = await createTransactionsE2eApp();
    app = e2eApp.app;
    prisma = e2eApp.prisma;

    const createdUser = await createTransactionTestUser(prisma, testUser);
    createdUserId = createdUser.id;
  });

  afterAll(async () => {
    await deleteUserByEmail(prisma, testUser.email);
    await prisma?.$disconnect();
    await app?.close();
  });

  it('creates unique monthly date ranges and returns them newest first', async () => {
    if (!app || !prisma || !createdUserId) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginTransactionTestUser(app, testUser);
    const baseTransaction = {
      name: 'Ada Lovelace',
      email: 'ada.customer@example.com',
      product: 'Dashdesk Pro',
      quantity: 3,
      totalCents: 12000,
    };

    await expect(
      agent.post('/api/transactions').send({
        ...baseTransaction,
        date: '2026-05-20',
      }),
    ).resolves.toMatchObject({ status: 201 });
    await expect(
      agent.post('/api/transactions').send({
        ...baseTransaction,
        name: 'Grace Hopper',
        email: 'grace.customer@example.com',
        date: '2026-05-25',
      }),
    ).resolves.toMatchObject({ status: 201 });
    await expect(
      agent.post('/api/transactions').send({
        ...baseTransaction,
        name: 'Linus Torvalds',
        email: 'linus.customer@example.com',
        date: '2026-06-02',
      }),
    ).resolves.toMatchObject({ status: 201 });

    await expect(
      prisma.transactionDateRange.count({ where: { userId: createdUserId } }),
    ).resolves.toBe(2);

    const response = await agent.get('/api/transactions/date-ranges');

    expect(response.status).toBe(200);
    const body = getBody<TransactionDateRangesDto>(response.body);

    expect(body.items).toHaveLength(2);
    expect(body.items).toEqual([
      {
        value: expect.any(String) as string,
        from: '2026-06-01',
        to: '2026-06-30',
      },
      {
        value: expect.any(String) as string,
        from: '2026-05-01',
        to: '2026-05-31',
      },
    ]);
  });
});
