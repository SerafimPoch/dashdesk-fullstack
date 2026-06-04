import 'dotenv/config';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { PrismaService } from '../../prisma/prisma.service';

const LEGACY_PG_SSL_MODES = new Set(['prefer', 'require', 'verify-ca']);

export interface RegisterResponseBody {
  message: string;
}

export interface LoginResponseBody {
  message: string;
  user: {
    email: string;
  };
}

export interface MeResponseBody {
  id: string;
  email: string;
}

export interface ErrorResponseBody {
  message: string | string[];
  error?: string;
  statusCode: number;
}

interface PasswordUserSeed {
  name: string;
  email: string;
  password: string;
}

export function getBody<TBody>(body: unknown): TBody {
  return body as TBody;
}

export function getCookies(setCookieHeader: unknown): string[] {
  if (Array.isArray(setCookieHeader)) {
    return setCookieHeader.filter(
      (cookie): cookie is string => typeof cookie === 'string',
    );
  }

  return typeof setCookieHeader === 'string' ? [setCookieHeader] : [];
}

export function getCookieValue(cookies: string[], name: string) {
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));
  const pair = cookie?.split(';')[0];

  return pair?.slice(name.length + 1);
}

export function createHttpAgent(app: INestApplication) {
  const httpServer = app.getHttpServer() as Parameters<typeof request.agent>[0];

  return request.agent(httpServer);
}

function normalizePostgresSslMode(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode');

    if (sslMode && LEGACY_PG_SSL_MODES.has(sslMode)) {
      url.searchParams.set('sslmode', 'verify-full');
      return url.toString();
    }
  } catch {
    return connectionString;
  }

  return connectionString;
}

export async function deleteUserByEmail(
  prisma: PrismaService | undefined,
  email: string,
) {
  if (!prisma) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (user) {
    await prisma.user.delete({ where: { id: user.id } });
  }
}

export async function createPasswordUser(
  prisma: PrismaService,
  user: PasswordUserSeed,
) {
  const passwordHash = await argon2.hash(user.password);

  return prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      passwordHash,
    },
    select: {
      id: true,
    },
  });
}

export async function createAuthE2eApp() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL is not defined');
  }

  process.env.DATABASE_URL = normalizePostgresSslMode(
    process.env.TEST_DATABASE_URL,
  );
  process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret';
  process.env.GOOGLE_CLIENT_ID ??= 'e2e-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET ??= 'e2e-google-client-secret';
  process.env.GOOGLE_CALLBACK_URL ??=
    'http://localhost/api/auth/oauth/google/callback';
  process.env.MICROSOFT_CLIENT_ID ??= 'e2e-microsoft-client-id';
  process.env.MICROSOFT_CLIENT_SECRET ??= 'e2e-microsoft-client-secret';
  process.env.MICROSOFT_CALLBACK_URL ??=
    'http://localhost/api/auth/oauth/microsoft/callback';

  const { AppModule } =
    jest.requireActual<typeof import('../../app.module')>('../../app.module');
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(cookieParser());

  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
  };
}
