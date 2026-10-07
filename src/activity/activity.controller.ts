import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ListActivityDto } from './dto/list-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../users/schemas/user.schema';

@Controller('activity')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListActivityDto) {
    return this.activityService.list(user.companyId, query);
  }
}