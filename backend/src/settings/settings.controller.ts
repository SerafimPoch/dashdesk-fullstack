import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_CONFIG,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_CONFIG,
} from '../auth/auth-cookie';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  DeleteAccountDto,
  UpdateAccountDto,
  UpdateProfileDto,
  UpdateSecurityDto,
  type UploadedAvatarFile,
} from './settings.dto';
import {
  SETTINGS_AVATAR_MAX_SIZE_BYTES,
  SettingsService,
} from './settings.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

type SettingsResponse = ReturnType<SettingsService['getSettings']>;
type SettingsProfileResponse = ReturnType<SettingsService['updateProfile']>;
type SettingsAccountResponse = ReturnType<SettingsService['updateAccount']>;
type SettingsSecurityResponse = ReturnType<SettingsService['updateSecurity']>;
type SettingsAvatarResponse = ReturnType<SettingsService['uploadAvatar']>;

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getSettings(@Req() req: AuthenticatedRequest): SettingsResponse {
    return this.settings.getSettings(req.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): SettingsProfileResponse {
    return this.settings.updateProfile(req.user.id, dto);
  }

  @Patch('account')
  updateAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateAccountDto,
  ): SettingsAccountResponse {
    return this.settings.updateAccount(req.user.id, dto);
  }

  @Patch('security')
  updateSecurity(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSecurityDto,
  ): SettingsSecurityResponse {
    return this.settings.updateSecurity(req.user.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: SETTINGS_AVATAR_MAX_SIZE_BYTES,
      },
    }),
  )
  uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: UploadedAvatarFile | undefined,
  ): SettingsAvatarResponse {
    return this.settings.uploadAvatar(req.user.id, file);
  }

  @Get('avatar')
  @Header('Cache-Control', 'private, max-age=300')
  async getAvatar(
    @Req() req: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const avatar = await this.settings.getAvatarFile(req.user.id);

    response.setHeader('Content-Type', avatar.mimeType);
    response.setHeader('Content-Length', String(avatar.size));
    response.send(Buffer.from(avatar.data));
  }

  @Delete('account')
  @HttpCode(200)
  async deleteAccount(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    await this.settings.deleteAccount(req.user.id, dto);

    response.clearCookie(REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE_CONFIG);
    response.clearCookie(ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_CONFIG);

    return {
      message: 'Account deleted successfully',
    };
  }
}
