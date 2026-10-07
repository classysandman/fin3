import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ActivateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}