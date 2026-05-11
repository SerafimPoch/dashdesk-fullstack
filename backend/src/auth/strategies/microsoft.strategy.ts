import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AccountProvider } from '@prisma/client';
import { Strategy } from 'passport-microsoft';
import { AuthService } from '../auth.service';

interface MicrosoftProfile {
  id: string;
  displayName?: string;
  emails?: Array<{ value: string }>;
  _json?: {
    mail?: string;
    userPrincipalName?: string;
    displayName?: string;
  };
}

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private readonly authService: AuthService) {
    const clientID = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const callbackURL = process.env.MICROSOFT_CALLBACK_URL;

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Microsoft OAuth env variables are not defined');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user.read'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: MicrosoftProfile,
  ) {
    const email =
      profile.emails?.[0]?.value ??
      profile._json?.mail ??
      profile._json?.userPrincipalName;

    if (!email) {
      throw new UnauthorizedException(
        'Microsoft profile does not contain email',
      );
    }

    return this.authService.loginWithOAuthProfile({
      provider: AccountProvider.MICROSOFT,
      providerAccountId: profile.id,
      email,
      name: profile.displayName ?? profile._json?.displayName ?? email,
    });
  }
}
