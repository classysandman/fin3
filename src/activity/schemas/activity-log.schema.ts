import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ActivityAction {
  COMPANY_REGISTERED = 'company.registered',
  COMPANY_ACTIVATED = 'company.activated',
  COMPANY_UPDATED = 'company.updated',
  USER_LOGIN = 'user.login',
  PASSWORD_CHANGED = 'user.password_changed',
  SUBSCRIPTION_SELECTED = 'subscription.selected',
  SUBSCRIPTION_CHANGED = 'subscription.changed',
  EMPLOYEE_ADDED = 'employee.added',
  EMPLOYEE_ACTIVATED = 'employee.activated',
  EMPLOYEE_REMOVED = 'employee.removed',
  FILE_UPLOADED = 'file.uploaded',
  FILE_DELETED = 'file.deleted',
  FILE_PERMISSIONS_CHANGED = 'file.permissions_changed',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ActivityLog {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop()
  userEmail?: string;

  @Prop({ required: true, enum: ActivityAction })
  action: ActivityAction;

  @Prop({ type: Object, default: {} })
  details: Record<string, unknown>;
}

export type ActivityLogDocument = HydratedDocument<ActivityLog>;
export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
ActivityLogSchema.index({ company: 1, createdAt: -1 });