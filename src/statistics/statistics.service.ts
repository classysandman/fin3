import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FilesService } from '../files/files.service';
import { PLANS } from '../subscriptions/plans.config';
import { getBillingPeriod } from '../subscriptions/billing-period.util';

@Injectable()
export class StatisticsService {
  constructor(
    private usersService: UsersService,
    private subscriptionsService: SubscriptionsService,
    private filesService: FilesService,
  ) {}

  async getOverview(companyId: string) {
    const [subscription, totalEmployees, activeEmployees, files] =
      await Promise.all([
        this.subscriptionsService.findByCompany(companyId),
        this.usersService.countEmployees(companyId),
        this.usersService.countActiveEmployees(companyId),
        this.filesService.getStats(companyId),
      ]);

    let usage: {
      plan: string;
      used: number;
      limit: number;
      periodEnd: Date;
    } | null = null;

    if (subscription) {
      const { start, end } = getBillingPeriod(subscription.activatedAt);
      usage = {
        plan: subscription.plan,
        used: await this.filesService.countInPeriod(companyId, start, end),
        limit: PLANS[subscription.plan].monthlyFileLimit,
        periodEnd: end,
      };
    }

    return {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        pending: totalEmployees - activeEmployees,
      },
      usage,
      files,
    };
  }
}