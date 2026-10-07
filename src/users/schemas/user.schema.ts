import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum Role {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  name?: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ required: true, enum: Role })
  role: Role;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  company: Types.ObjectId;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ select: false, index: true })
  activationToken?: string;

  @Prop({ select: false })
  activationExpires?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);