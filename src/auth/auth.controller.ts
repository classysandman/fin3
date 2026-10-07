import { Body, Controller, Get, HttpCode, Post, Query, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivateEmployeeDto } from './dto/activate-employee.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterCompanyDto) {
    return this.authService.registerCompany(dto);
  }

  @Get('activate')
  activate(@Query('token') token: string) {
    return this.authService.activate(token);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

    @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, dto);
  }

    @Post('activate-employee')
  @HttpCode(200)
  activateEmployee(@Body() dto: ActivateEmployeeDto) {
    return this.authService.activateEmployee(dto);
  }

}