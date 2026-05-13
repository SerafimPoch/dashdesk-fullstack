import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
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
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const search = value.trim();

    return search.length > 0 ? search : undefined;
  })
  @IsString()
  @MaxLength(100)
  search?: string;
}
