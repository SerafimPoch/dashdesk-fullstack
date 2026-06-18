import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { formatDateOnly, parseDateOnly } from '../common/date/date-only';
import type {
  DeleteAccountDto,
  UpdateAccountDto,
  UpdateProfileDto,
  UpdateSecurityDto,
  UploadedAvatarFile,
} from './settings.dto';

export const SETTINGS_AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const settingsUserSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  passwordHash: true,
  dateOfBirth: true,
  phoneNumber: true,
  address: true,
  twoFactorEnabled: true,
  avatar: {
    select: {
      mimeType: true,
      size: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.UserSelect;

type SettingsUser = Prisma.UserGetPayload<{
  select: typeof settingsUserSelect;
}>;
type AvatarMetadataRecord = NonNullable<SettingsUser['avatar']>;

interface AvatarMetadataDto {
  url: string;
  mimeType: string;
  size: number;
  updatedAt: Date;
}

interface SettingsProfileDto {
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  address: string | null;
  avatar: AvatarMetadataDto | null;
}

interface SettingsAccountDto {
  email: string;
  hasPassword: boolean;
}

interface SettingsSecurityDto {
  twoFactorEnabled: boolean;
}

interface SettingsDto {
  profile: SettingsProfileDto;
  account: SettingsAccountDto;
  security: SettingsSecurityDto;
}

interface AvatarFileDto {
  data: Uint8Array<ArrayBuffer>;
  mimeType: string;
  size: number;
}

function splitFallbackName(name: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

function avatarMetadata(
  avatar: AvatarMetadataRecord | null,
): AvatarMetadataDto | null {
  if (!avatar) {
    return null;
  }

  return {
    url: '/api/settings/avatar',
    mimeType: avatar.mimeType,
    size: avatar.size,
    updatedAt: avatar.updatedAt,
  };
}

function toSettingsDto(user: SettingsUser): SettingsDto {
  const fallbackName = splitFallbackName(user.name);

  return {
    profile: {
      firstName: user.firstName ?? fallbackName.firstName,
      lastName: user.lastName ?? fallbackName.lastName,
      dateOfBirth: user.dateOfBirth ? formatDateOnly(user.dateOfBirth) : null,
      phoneNumber: user.phoneNumber,
      address: user.address,
      avatar: avatarMetadata(user.avatar),
    },
    account: {
      email: user.email,
      hasPassword: Boolean(user.passwordHash),
    },
    security: {
      twoFactorEnabled: user.twoFactorEnabled,
    },
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string): Promise<SettingsDto> {
    const user = await this.findSettingsUser(userId);

    return toSettingsDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<SettingsProfileDto> {
    const user = await this.findSettingsUser(userId);
    const fallbackName = splitFallbackName(user.name);
    const nextFirstName =
      dto.firstName ?? user.firstName ?? fallbackName.firstName;
    const nextLastName = dto.lastName ?? user.lastName ?? fallbackName.lastName;
    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) {
      data.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      data.lastName = dto.lastName;
    }

    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = parseDateOnly(dto.dateOfBirth);
    }

    if (dto.phoneNumber !== undefined) {
      data.phoneNumber = dto.phoneNumber;
    }

    if (dto.address !== undefined) {
      data.address = dto.address;
    }

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const nextName = [nextFirstName, nextLastName]
        .filter((part): part is string => Boolean(part))
        .join(' ')
        .trim();

      if (nextName) {
        data.name = nextName;
      }
    }

    if (Object.keys(data).length === 0) {
      return toSettingsDto(user).profile;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: settingsUserSelect,
    });

    return toSettingsDto(updatedUser).profile;
  }

  async updateAccount(
    userId: string,
    dto: UpdateAccountDto,
  ): Promise<SettingsAccountDto> {
    const user = await this.findSettingsUser(userId);
    const wantsEmailUpdate =
      dto.email !== undefined && dto.email !== user.email;
    const wantsPasswordUpdate = dto.newPassword !== undefined;

    if (!wantsEmailUpdate && !wantsPasswordUpdate) {
      throw new BadRequestException('No account changes were provided');
    }

    if (wantsPasswordUpdate && !user.passwordHash) {
      throw new BadRequestException(
        'Password setup is not supported for OAuth-only users',
      );
    }

    if (user.passwordHash) {
      await this.verifyCurrentPassword(user.passwordHash, dto.currentPassword);
    }

    if (wantsEmailUpdate && dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (wantsEmailUpdate && dto.email) {
      data.email = dto.email;
    }

    if (wantsPasswordUpdate && dto.newPassword) {
      data.passwordHash = await argon2.hash(dto.newPassword);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: settingsUserSelect,
    });

    return toSettingsDto(updatedUser).account;
  }

  async updateSecurity(
    userId: string,
    dto: UpdateSecurityDto,
  ): Promise<SettingsSecurityDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: dto.twoFactorEnabled,
      },
      select: {
        twoFactorEnabled: true,
      },
    });

    return {
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  async uploadAvatar(
    userId: string,
    file: UploadedAvatarFile | undefined,
  ): Promise<AvatarMetadataDto> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Avatar must be a PNG, JPG, or WebP image');
    }

    if (file.size > SETTINGS_AVATAR_MAX_SIZE_BYTES) {
      throw new BadRequestException('Avatar must be 2MB or smaller');
    }

    const avatarData = Uint8Array.from(file.buffer);
    const avatar: AvatarMetadataRecord = await this.prisma.userAvatar.upsert({
      where: { userId },
      create: {
        userId,
        mimeType: file.mimetype,
        size: file.size,
        data: avatarData,
      },
      update: {
        mimeType: file.mimetype,
        size: file.size,
        data: avatarData,
      },
      select: {
        mimeType: true,
        size: true,
        updatedAt: true,
      },
    });

    const metadata = avatarMetadata(avatar);

    if (!metadata) {
      throw new NotFoundException('Avatar was not saved');
    }

    return metadata;
  }

  async getAvatarFile(userId: string): Promise<AvatarFileDto> {
    const avatar: AvatarFileDto | null =
      await this.prisma.userAvatar.findUnique({
        where: { userId },
        select: {
          data: true,
          mimeType: true,
          size: true,
        },
      });

    if (!avatar) {
      throw new NotFoundException('Avatar was not found');
    }

    return avatar;
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    if (dto.confirmEmail !== user.email) {
      throw new BadRequestException('Confirmation email does not match');
    }

    if (user.passwordHash) {
      await this.verifyCurrentPassword(user.passwordHash, dto.currentPassword);
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  private async findSettingsUser(userId: string): Promise<SettingsUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: settingsUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    return user;
  }

  private async verifyCurrentPassword(
    passwordHash: string,
    currentPassword: string | undefined,
  ): Promise<void> {
    if (!currentPassword) {
      throw new UnauthorizedException('Current password is required');
    }

    const isPasswordValid = await argon2.verify(passwordHash, currentPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
  }
}
