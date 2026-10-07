import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../users/schemas/user.schema';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get()
  getOverview(@CurrentUser() user: JwtPayload) {
    return this.statisticsService.getOverview(user.companyId);
  }
}