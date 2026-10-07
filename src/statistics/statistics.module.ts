import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FilesModule } from '../files/files.module';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';

@Module({
  imports: [SubscriptionsModule, FilesModule],
  providers: [StatisticsService],
  controllers: [StatisticsController],
})
export class StatisticsModule {}