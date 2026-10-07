import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum Industry {
  FINANCE = 'finance',
  ECOMMERCE = 'ecommerce',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  TECHNOLOGY = 'technology',
  MANUFACTURING = 'manufacturing',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ required: true, enum: Industry })
  industry: Industry;

  @Prop({ default: false })
  isActive: boolean;
}

export type CompanyDocument = HydratedDocument<Company>;
export const CompanySchema = SchemaFactory.createForClass(Company);