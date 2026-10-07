import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { FileVisibility } from '../schemas/stored-file.schema';

export class UpdatePermissionsDto {
  @IsEnum(FileVisibility)
  visibility: FileVisibility;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  allowedUserIds?: string[];
}