import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createTransactionTestUser,
  createTransactionsE2eApp,
  deleteUserByEmail,
  getBody,
  loginTransactionTestUser,
  type TransactionItemDto,
  type TransactionsListDto,
} from './transactions-e2e.helpers';

describe('Transactions e2e: create -> list', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Transactions User',
    email: `transactions-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  const transaction = {
    name: 'Ada Lovelace',
    email: 'ada.customer@example.com',
    product: 'Dashdesk Pro',
    quantity: 3,
    totalCents: 12000,
    date: '2026-05-20',
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

  it('creates a transaction and lists it for the current user', async () => {
    if (!app || !prisma || !createdUserId) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginTransactionTestUser(app, testUser);

    const createResponse = await agent
      .post('/api/transactions')
      .send(transaction);

    expect(createResponse.status).toBe(201);
    const createdTransaction = getBody<TransactionItemDto>(createResponse.body);
    expect(createdTransaction).toEqual({
      id: expect.any(String) as string,
      name: transaction.name,
      email: transaction.email,
      product: transaction.product,
      quantity: '3 pcs',
      total: '$120',
    });

    const dbTransaction = await prisma.transaction.findUnique({
      where: { id: createdTransaction.id },
      select: {
        userId: true,
        name: true,
        email: true,
        product: true,
        quantity: true,
        totalCents: true,
        date: true,
      },
    });

    expect(dbTransaction).toEqual({
      userId: createdUserId,
      name: transaction.name,
      email: transaction.email,
      product: transaction.product,
      quantity: transaction.quantity,
      totalCents: transaction.totalCents,
      date: new Date('2026-05-20T00:00:00.000Z'),
    });

    const listResponse = await agent.get('/api/transactions').query({
      page: 1,
      limit: 10,
    });

    expect(listResponse.status).toBe(200);
    const listBody = getBody<TransactionsListDto>(listResponse.body);
    expect(listBody).toEqual({
      items: [createdTransaction],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });
});
