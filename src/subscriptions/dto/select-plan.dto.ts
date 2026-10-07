import { IsEnum } from 'class-validator';
import { PlanType } from '../plans.config';

export class SelectPlanDto {
  @IsEnum(PlanType)
  plan: PlanType;
}