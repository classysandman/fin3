import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FilesService } from '../files/files.service';
import { PLANS } from '../subscriptions/plans.config';
import { getBillingPeriod } from '../subscriptions/billing-period.util';

const round = (value: number) => Math.round(value * 100) / 100;

@Injectable()
export class BillingService {
  constructor(
    private usersService: UsersService,
    private subscriptionsService: SubscriptionsService,
    private filesService: FilesService,
  ) {}

  async getCurrent(companyId: string) {
    const subscription =
      await this.subscriptionsService.findByCompany(companyId);
    if (!subscription) {
      throw new NotFoundException('No subscription selected yet');
    }

    const plan = PLANS[subscription.plan];
    const now = new Date();
    const { start, end } = getBillingPeriod(subscription.activatedAt, now);

    const [employeeCount, filesUsed] = await Promise.all([
      this.usersService.countEmployees(companyId),
      this.filesService.countInPeriod(companyId, start, end),
    ]);

    const employeesCost = round(employeeCount * plan.pricePerEmployee);
    const overageFiles =
      plan.overagePricePerFile > 0
        ? Math.max(0, filesUsed - plan.monthlyFileLimit)
        : 0;
    const overageCost = round(overageFiles * plan.overagePricePerFile);
    const total = round(plan.fixedPrice + employeesCost + overageCost);

    return {
      currency: 'USD',
      plan: plan.type,
      period: { start, end },
      nextPaymentDate: end,
      daysUntilPayment: Math.ceil(
        (end.getTime() - now.getTime()) / (24 * 3600 * 1000),
      ),
      fixedFee: plan.fixedPrice,
      employees: {
        count: employeeCount,
        pricePerEmployee: plan.pricePerEmployee,
        cost: employeesCost,
      },
      files: {
        used: filesUsed,
        limit: plan.monthlyFileLimit,
        overageFiles,
        overagePricePerFile: plan.overagePricePerFile,
        overageCost,
      },
      total,
    };
  }
}