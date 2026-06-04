import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createTransactionTestUser,
  createTransactionsE2eApp,
  createHttpAgent,
  deleteUserByEmail,
  getBody,
  loginTransactionTestUser,
  type ErrorResponseBody,
} from './transactions-e2e.helpers';

describe('Transactions e2e: protection and validation', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let createdUserId: string | undefined;

  const testUser = {
    name: 'E2E Transactions Validation User',
    email: `transactions-validation-e2e-${Date.now()}@example.com`,
    password: 'StrongPass123',
  };

  const validTransaction = {
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

  it('rejects unauthenticated transaction requests', async () => {
    if (!app) {
      throw new Error('E2E app was not initialized');
    }

    const agent = createHttpAgent(app);

    await expect(agent.get('/api/transactions')).resolves.toMatchObject({
      status: 401,
    });
    await expect(
      agent.get('/api/transactions/date-ranges'),
    ).resolves.toMatchObject({
      status: 401,
    });
    await expect(
      agent.post('/api/transactions').send(validTransaction),
    ).resolves.toMatchObject({
      status: 401,
    });
  });

  it('rejects invalid create payloads and invalid query ranges', async () => {
    if (!app || !prisma || !createdUserId) {
      throw new Error('E2E app was not initialized');
    }

    const agent = await loginTransactionTestUser(app, testUser);

    const invalidCreateResponse = await agent.post('/api/transactions').send({
      name: 'A',
      email: 'not-an-email',
      product: 'D',
      quantity: 0,
      totalCents: -1,
      date: '2026-02-31',
    });

    expect(invalidCreateResponse.status).toBe(400);
    const invalidCreateBody = getBody<ErrorResponseBody>(
      invalidCreateResponse.body,
    );
    expect(invalidCreateBody.statusCode).toBe(400);
    expect(Array.isArray(invalidCreateBody.message)).toBe(true);
    await expect(
      prisma.transaction.count({ where: { userId: createdUserId } }),
    ).resolves.toBe(0);

    const invalidQueryResponse = await agent.get('/api/transactions').query({
      from: '2026-06-01',
      to: '2026-05-31',
    });

    expect(invalidQueryResponse.status).toBe(400);
    expect(getBody<ErrorResponseBody>(invalidQueryResponse.body)).toMatchObject(
      {
        message: 'From date must be less than or equal to to date',
        error: 'Bad Request',
        statusCode: 400,
      },
    );
  });
});
