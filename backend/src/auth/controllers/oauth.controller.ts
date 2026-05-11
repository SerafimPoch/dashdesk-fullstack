import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_CONFIG,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_CONFIG,
} from '../auth-cookie';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import type { AuthResult } from '../auth.types';
import { MicrosoftAuthGuard } from '../guards/microsoft-auth.guard';

interface OAuthRequest extends Request {
  user: AuthResult;
}

@Controller('auth/oauth')
export class OAuthController {
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {}

  @UseGuards(MicrosoftAuthGuard)
  @Get('microsoft')
  microsoftAuth() {}

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

  @UseGuards(MicrosoftAuthGuard)
  @Get('microsoft/callback')
  microsoftCallback(
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
