import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { PLANS, PlanType } from './plans.config';
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private usersService: UsersService,
  ) {}

  getPlans() {
    return Object.values(PLANS);
  }

  findByCompany(companyId: string) {
    return this.subscriptionModel.findOne({ company: companyId });
  }

  async getCurrent(companyId: string) {
    const subscription = await this.findByCompany(companyId);
    if (!subscription) {
      throw new NotFoundException('No subscription selected yet');
    }
    const employeeCount = await this.usersService.countEmployees(companyId);
    return this.toView(subscription, employeeCount);
  }

  async subscribe(companyId: string, plan: PlanType) {
    const existing = await this.findByCompany(companyId);
    if (existing) {
      throw new ConflictException(
        'Subscription already exists. Use the change endpoint instead',
      );
    }

    const subscription = await this.subscriptionModel.create({
      company: companyId,
      plan,
      activatedAt: new Date(),
    });

    const employeeCount = await this.usersService.countEmployees(companyId);
    return this.toView(subscription, employeeCount);
  }

  async change(companyId: string, plan: PlanType) {
    const subscription = await this.findByCompany(companyId);
    if (!subscription) {
      throw new NotFoundException('No subscription selected yet');
    }
    if (subscription.plan === plan) {
      throw new BadRequestException('Company is already on this plan');
    }

    const target = PLANS[plan];
    const employeeCount = await this.usersService.countEmployees(companyId);

    if (target.maxEmployees !== null && employeeCount > target.maxEmployees) {
      throw new BadRequestException(
        `The ${plan} plan allows ${target.maxEmployees} employees. Remove ${employeeCount - target.maxEmployees} before switching`,
      );
    }

    const direction =
      target.level > PLANS[subscription.plan].level ? 'upgrade' : 'downgrade';

    subscription.plan = plan;
    subscription.activatedAt = new Date();
    await subscription.save();

    return { direction, ...this.toView(subscription, employeeCount) };
  }

  private toView(subscription: SubscriptionDocument, employeeCount: number) {
    return {
      plan: subscription.plan,
      activatedAt: subscription.activatedAt,
      billingDay: subscription.activatedAt.getUTCDate(),
      employeeCount,
      limits: PLANS[subscription.plan],
    };
  }
    async assertCanAddEmployee(companyId: string) {
    const subscription = await this.findByCompany(companyId);
    if (!subscription) {
      throw new ForbiddenException('Choose a subscription plan first');
    }

    const max = PLANS[subscription.plan].maxEmployees;
    if (max === null) {
      return;
    }

    const count = await this.usersService.countEmployees(companyId);
    if (count >= max) {
      throw new ForbiddenException(
        `The ${subscription.plan} plan allows ${max} employees. Upgrade to add more`,
      );
    }
  }
}