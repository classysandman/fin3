import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MailService } from '../mail/mail.service';
import { Role } from '../users/schemas/user.schema';
import { AddEmployeeDto } from './dto/add-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private subscriptionsService: SubscriptionsService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async add(companyId: string, dto: AddEmployeeDto) {
    await this.subscriptionsService.assertCanAddEmployee(companyId);

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const company = await this.companiesService.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const token = randomBytes(32).toString('hex');
    const ttlHours = Number(this.config.get('ACTIVATION_TTL_HOURS') ?? 24);

    const employee = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      role: Role.EMPLOYEE,
      company: company._id,
      activationToken: token,
      activationExpires: new Date(Date.now() + ttlHours * 3600 * 1000),
    });

    try {
      await this.mailService.sendEmployeeInvitation(
        employee.email,
        company.name,
        token,
      );
    } catch {
      await this.usersService.deleteById(employee.id);
      throw new InternalServerErrorException('Could not send invitation email');
    }

    return {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      isActive: employee.isActive,
    };
  }

  list(companyId: string) {
    return this.usersService.findEmployees(companyId);
  }

  async remove(companyId: string, id: string) {
    const employee = await this.usersService.findEmployeeInCompany(id, companyId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.usersService.deleteById(id);
    return { message: 'Employee removed' };
  }
}