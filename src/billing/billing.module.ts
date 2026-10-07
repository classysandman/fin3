import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FilesModule } from '../files/files.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [SubscriptionsModule, FilesModule],
  providers: [BillingService],
  controllers: [BillingController],
})
export class BillingModule {}