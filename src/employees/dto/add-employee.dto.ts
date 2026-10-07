import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AddEmployeeDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}