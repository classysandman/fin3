import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum FileVisibility {
  ALL = 'all',
  RESTRICTED = 'restricted',
}

@Schema({ timestamps: true })
export class StoredFile {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy?: Types.ObjectId;

  @Prop({ required: true })
  uploadedByEmail: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true, unique: true })
  storageKey: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true, enum: FileVisibility, default: FileVisibility.ALL })
  visibility: FileVisibility;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  allowedUsers: Types.ObjectId[];

  @Prop()
  deletedAt?: Date;
}

export type StoredFileDocument = HydratedDocument<StoredFile>;
export const StoredFileSchema = SchemaFactory.createForClass(StoredFile);
StoredFileSchema.index({ company: 1, createdAt: 1 });