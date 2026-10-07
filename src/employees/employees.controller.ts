import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/schemas/activity-log.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../users/schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class EmployeesController {
  constructor(
    private employeesService: EmployeesService,
    private activityService: ActivityService,
  ) {}

  @Post()
  async add(@CurrentUser() user: JwtPayload, @Body() dto: AddEmployeeDto) {
    const result = await this.employeesService.add(user.companyId, dto);

    await this.activityService.log({
      companyId: user.companyId,
      userId: user.sub,
      action: ActivityAction.EMPLOYEE_ADDED,
      details: { employeeId: result.id, email: result.email },
    });

    return result;
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.employeesService.list(user.companyId);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const result = await this.employeesService.remove(user.companyId, id);

    await this.activityService.log({
      companyId: user.companyId,
      userId: user.sub,
      action: ActivityAction.EMPLOYEE_REMOVED,
      details: { employeeId: id },
    });

    return result;
  }
}