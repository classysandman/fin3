import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import {
  ActivityAction,
  ActivityLog,
  ActivityLogDocument,
} from './schemas/activity-log.schema';
import { ListActivityDto } from './dto/list-activity.dto';

interface LogInput {
  companyId: string;
  userId: string;
  action: ActivityAction;
  details?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectModel(ActivityLog.name)
    private logModel: Model<ActivityLogDocument>,
    private usersService: UsersService,
  ) {}

  async log(input: LogInput) {
    try {
      const user = await this.usersService.findById(input.userId);
      await this.logModel.create({
        company: input.companyId,
        user: input.userId,
        userEmail: user?.email,
        action: input.action,
        details: input.details ?? {},
      });
    } catch (error) {
      this.logger.error('Failed to write activity log', error);
    }
  }

  async list(companyId: string, query: ListActivityDto) {
    const filter: QueryFilter<ActivityLogDocument> = { company: companyId };
    if (query.action) {
      filter.action = query.action;
    }

    const [data, total] = await Promise.all([
      this.logModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      this.logModel.countDocuments(filter),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }
}