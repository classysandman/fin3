import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/schemas/activity-log.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../users/schemas/user.schema';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(
    private companiesService: CompaniesService,
    private activityService: ActivityService,
  ) {}

  @Get('me')
  async getMine(@CurrentUser() user: JwtPayload) {
    const company = await this.companiesService.findById(user.companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  @Patch('me')
  @Roles(Role.ADMIN)
  async updateMine(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    const company = await this.companiesService.update(user.companyId, dto);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.activityService.log({
      companyId: user.companyId,
      userId: user.sub,
      action: ActivityAction.COMPANY_UPDATED,
      details: { fields: Object.keys(dto) },
    });

    return company;
  }
}