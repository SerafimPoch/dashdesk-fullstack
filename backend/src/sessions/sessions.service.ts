import argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async deleteSession(sessionId: string) {
    await this.prisma.session.delete({
      where: { id: sessionId },
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

  async rotateSession(sessionId: string, refreshToken: string) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const tokenHash = await argon2.hash(refreshToken);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        tokenHash,
        expiresAt,
      },
    });
  }
}
