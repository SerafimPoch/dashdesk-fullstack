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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_CONFIG,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_CONFIG,
} from './auth-cookie';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
  };
};

type RequestWithCookies = Request & {
  cookies: Record<string, string | undefined>;
};

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshToken, accessToken, ...data } = await this.auth.login(dto);

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
    const cookies = request.cookies as Record<string, string | undefined>;
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException();
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
    const cookies = request.cookies as Record<string, string | undefined>;
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException();
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
}
