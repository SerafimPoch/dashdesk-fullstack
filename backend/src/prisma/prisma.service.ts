import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const LEGACY_PG_SSL_MODES = new Set(['prefer', 'require', 'verify-ca']);

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

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    const adapter = new PrismaPg({
      connectionString: normalizePostgresSslMode(connectionString),
    });

    super({ adapter });
  }
}
