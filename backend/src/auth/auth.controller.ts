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

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
  };
};

type RequestWithCookies = Request & {
  cookies: {
    refreshToken?: string;
  };
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
    const { refreshToken, ...data } = await this.auth.login(dto);
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    return data;
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Req() request: RequestWithCookies,
  ) {
    const { refreshToken } = request.cookies;

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    response.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    return this.auth.logout(refreshToken);
  }

  @Post('refresh')
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshToken } = request.cookies;

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const { refreshToken: nextRefreshToken, ...data } =
      await this.auth.refresh(refreshToken);

    response.cookie('refreshToken', nextRefreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
