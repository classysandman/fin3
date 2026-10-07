import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SelectPlanDto } from './dto/select-plan.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/schemas/activity-log.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../users/schemas/user.schema';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private activityService: ActivityService,
  ) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('current')
  getCurrent(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getCurrent(user.companyId);
  }

  @Post()
  @Roles(Role.ADMIN)
  async subscribe(@CurrentUser() user: JwtPayload, @Body() dto: SelectPlanDto) {
    const result = await this.subscriptionsService.subscribe(
      user.companyId,
      dto.plan,
    );

    await this.activityService.log({
      companyId: user.companyId,
      userId: user.sub,
      action: ActivityAction.SUBSCRIPTION_SELECTED,
      details: { plan: dto.plan },
    });

    return result;
  }

  @Patch()
  @Roles(Role.ADMIN)
  async change(@CurrentUser() user: JwtPayload, @Body() dto: SelectPlanDto) {
    const result = await this.subscriptionsService.change(
      user.companyId,
      dto.plan,
    );

    await this.activityService.log({
      companyId: user.companyId,
      userId: user.sub,
      action: ActivityAction.SUBSCRIPTION_CHANGED,
      details: { plan: dto.plan, direction: result.direction },
    });

    return result;
  }
}