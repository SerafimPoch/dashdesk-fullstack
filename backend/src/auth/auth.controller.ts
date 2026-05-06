import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_CONFIG,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_CONFIG,
} from './auth-cookie';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { AuthenticatedUser, AuthResult } from './auth.types';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

interface OAuthRequest extends Request {
  user: AuthResult;
}

interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Res({ passthrough: true }) response: Response,
    @Req() req: AuthenticatedRequest,
  ) {
    const { refreshToken, accessToken, ...data } = await this.auth.login(
      req.user,
    );

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      REFRESH_TOKEN_COOKIE_CONFIG,
    );
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      ACCESS_TOKEN_COOKIE_CONFIG,
    );

    return data;
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Req() request: RequestWithCookies,
  ) {
    const cookies = request.cookies;
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Wrong token');
    }

    response.clearCookie(REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE_CONFIG);
    response.clearCookie(ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_CONFIG);

    return this.auth.logout(refreshToken);
  }

  @Post('refresh')
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = request.cookies;
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Wrong token');
    }

    const {
      refreshToken: nextRefreshToken,
      accessToken,
      ...data
    } = await this.auth.refresh(refreshToken);

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      nextRefreshToken,
      REFRESH_TOKEN_COOKIE_CONFIG,
    );
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      ACCESS_TOKEN_COOKIE_CONFIG,
    );

    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(
    @Req() req: OAuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshToken, accessToken } = req.user;

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      REFRESH_TOKEN_COOKIE_CONFIG,
    );
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      ACCESS_TOKEN_COOKIE_CONFIG,
    );

    return response.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
}
