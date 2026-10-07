import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { MailService } from '../mail/mail.service';
import { Role } from '../users/schemas/user.schema';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivateEmployeeDto } from './dto/activate-employee.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/schemas/activity-log.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private mailService: MailService,
    private config: ConfigService,
    private jwtService: JwtService,
    private activityService: ActivityService,
  ) {}

  async registerCompany(dto: RegisterCompanyDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const company = await this.companiesService.create({
      name: dto.companyName,
      country: dto.country,
      industry: dto.industry,
    });

    const token = randomBytes(32).toString('hex');
    const ttlHours = Number(this.config.get('ACTIVATION_TTL_HOURS') ?? 24);

    const user = await this.usersService.create({
      email: dto.email,
      password: await bcrypt.hash(dto.password, 10),
      role: Role.ADMIN,
      company: company._id,
      activationToken: token,
      activationExpires: new Date(Date.now() + ttlHours * 3600 * 1000),
    });

    try {
      await this.mailService.sendActivationEmail(user.email, company.name, token);
    } catch {
      await this.usersService.deleteById(user.id);
      await this.companiesService.deleteById(company.id);
      throw new InternalServerErrorException('Could not send activation email');
    }
        await this.activityService.log({
      companyId: company.id,
      userId: user.id,
      action: ActivityAction.COMPANY_REGISTERED,
    });

    return { message: 'Registration successful. Check your email to activate your account.' };
  }

  async activate(token: string) {
    const user = await this.usersService.findByActivationToken(token);
    if (!user || user.role !== Role.ADMIN) {
      throw new BadRequestException('Invalid or expired activation link');
    }

    user.isActive = true;
    user.activationToken = undefined;
    user.activationExpires = undefined;
    await user.save();

    await this.companiesService.activate(user.company.toString());
        await this.activityService.log({
      companyId: user.company.toString(),
      userId: user.id,
      action: ActivityAction.COMPANY_ACTIVATED,
    });

    return { message: 'Account activated. You can now log in.' };
  }

    async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is not activated');
    }

    const payload: JwtPayload = {
      sub: user.id,
      companyId: user.company.toString(),
      role: user.role,
    };

        await this.activityService.log({
      companyId: payload.companyId,
      userId: user.id,
      action: ActivityAction.USER_LOGIN,
    });

    return { accessToken: await this.jwtService.signAsync(payload) };
  }
    async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user || !user.password) {
      throw new UnauthorizedException();
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

        await this.activityService.log({
      companyId: user.company.toString(),
      userId: user.id,
      action: ActivityAction.PASSWORD_CHANGED,
    });

    return { message: 'Password changed successfully' };
  }
    async activateEmployee(dto: ActivateEmployeeDto) {
    const user = await this.usersService.findByActivationToken(dto.token);
    if (!user || user.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Invalid or expired activation link');
    }

    user.password = await bcrypt.hash(dto.password, 10);
    user.isActive = true;
    user.activationToken = undefined;
    user.activationExpires = undefined;
    await user.save();

        await this.activityService.log({
      companyId: user.company.toString(),
      userId: user.id,
      action: ActivityAction.EMPLOYEE_ACTIVATED,
    });

    return { message: 'Account activated. You can now log in.' };
  }
}