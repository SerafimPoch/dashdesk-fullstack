import { Transform, Type } from 'class-transformer';
import {
  emptyStringToUndefined,
  trimString,
} from '../common/transforms/string';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToUndefined(value))
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class CreateUserDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  password!: string;
}

export interface UserItemDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
