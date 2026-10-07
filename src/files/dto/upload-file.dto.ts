import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { FileVisibility } from '../schemas/stored-file.schema';

export class UploadFileDto {
  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined;
    }
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  allowedUserIds?: string[];
}