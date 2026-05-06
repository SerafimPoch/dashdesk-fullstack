import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import argon2 from 'argon2';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AccountProvider } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import type { AuthenticatedUser, AuthResult } from './auth.types';

interface OAuthProfile {
  provider: AccountProvider;
  providerAccountId: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionsService,
    private readonly accountService: AccountsService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (user) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const createdUser = await this.userService.create({
      passwordHash,
      ...dto,
    });

    return {
      message: `User ${createdUser.name} with ${createdUser.email} was successfully created`,
    };
  }

  async login(user: AuthenticatedUser): Promise<AuthResult> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const sessionId = crypto.randomUUID();
    const secret = crypto.randomUUID();
    const refreshToken = `${sessionId}.${secret}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.sessionService.createSession({
      sessionId,
      userId: user.id,
      refreshToken,
      expiresAt,
    });

    return {
      message: 'User logged in successfully',
      accessToken,
      refreshToken,
      user: {
        email: user.email,
      },
    };
  }

  async loginWithOAuthProfile({
    provider,
    providerAccountId,
    email,
    name,
  }: OAuthProfile): Promise<AuthResult> {
    const account = await this.accountService.findByProviderAccount(
      provider,
      providerAccountId,
    );

    if (account) {
      return this.login(account.user);
    }

    const user = await this.userService.findByEmail(email);

    if (user) {
      await this.accountService.createOAuthAccount({
        userId: user.id,
        provider,
        providerAccountId,
        email,
      });

      return this.login(user);
    }

    const createdUser = await this.userService.createOAuthUser({ name, email });

    await this.accountService.createOAuthAccount({
      userId: createdUser.id,
      provider,
      providerAccountId,
      email,
    });

    return this.login(createdUser);
  }

  async refresh(rT: string) {
    const session = await this.sessionService.verifyToken(rT);

    if (!session) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findById(session.userId);

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = `${session.id}.${crypto.randomUUID()}`;

    await this.sessionService.rotateSession(session.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    const session = await this.sessionService.verifyToken(refreshToken);

    if (!session) {
      throw new UnauthorizedException('No registered session');
    }

    await this.sessionService.deleteSession(session.id);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    const isVerifiedPassword = await argon2.verify(user.passwordHash, password);

    if (!isVerifiedPassword) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  }
}
