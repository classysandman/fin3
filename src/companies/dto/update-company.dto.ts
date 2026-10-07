import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Industry } from '../schemas/company.schema';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  country?: string;

  @IsOptional()
  @IsEnum(Industry)
  industry?: Industry;
}