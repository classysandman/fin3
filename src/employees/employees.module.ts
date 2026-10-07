import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MailModule } from '../mail/mail.module';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';

@Module({
  imports: [CompaniesModule, SubscriptionsModule, MailModule],
  providers: [EmployeesService],
  controllers: [EmployeesController],
})
export class EmployeesModule {}