import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { MailModule } from './mail/mail.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { EmployeesModule } from './employees/employees.module';
import { FilesModule } from './files/files.module';
import { BillingModule } from './billing/billing.module';
import { ActivityModule } from './activity/activity.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    UsersModule,
    CompaniesModule,
    MailModule,
    AuthModule,
    MailModule,
    AuthModule,
    SubscriptionsModule,
    SubscriptionsModule,
    EmployeesModule,
    EmployeesModule,
    FilesModule,
    FilesModule,
    BillingModule,
    BillingModule,
    ActivityModule,
    StatisticsModule,
  ],
})
export class AppModule {}