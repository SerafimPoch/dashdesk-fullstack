import { Transform } from 'class-transformer';
import { DATE_ONLY_PATTERN } from '../common/date/date-only';
import {
  emptyStringToUndefined,
  trimString,
} from '../common/transforms/string';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const optionalTrimmedString = ({ value }: { value: unknown }) =>
  emptyStringToUndefined(trimString(value));

export class UpdateProfileDto {
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToUndefined(value))
  @Matches(DATE_ONLY_PATTERN)
  dateOfBirth?: string;

  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  address?: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword?: string;
}

export class UpdateSecurityDto {
  @IsBoolean()
  twoFactorEnabled!: boolean;
}

export class DeleteAccountDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  confirmEmail!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  currentPassword?: string;
}

export interface UploadedAvatarFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}
