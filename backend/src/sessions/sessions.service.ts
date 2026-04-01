import { PrismaService } from 'src/prisma/prisma.service';
import argon2 from 'argon2';
import { Injectable } from '@nestjs/common';

interface Session {
  sessionId: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: Session) {
    const tokenHash = await argon2.hash(data.refreshToken);

    await this.prisma.session.create({
      data: {
        id: data.sessionId,
        userId: data.userId,
        expiresAt: data.expiresAt,
        tokenHash,
      },
    });
  }

  async verifyToken(refreshToken: string) {
    const sessionId = refreshToken.split('.')[0];

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      const isTokenValid = await argon2.verify(session.tokenHash, refreshToken);

      if (session.revokedAt) {
        return null;
      }

      if (session.expiresAt < new Date()) {
        return null;
      }

      if (!isTokenValid) {
        return null;
      }

      return session;
    }

    return null;
  }
}
