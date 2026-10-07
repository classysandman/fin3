import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StoredFile, StoredFileSchema } from './schemas/stored-file.schema';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoredFile.name, schema: StoredFileSchema },
    ]),
    SubscriptionsModule,
  ],
  providers: [FilesService, StorageService],
  controllers: [FilesController],
  exports: [FilesService, StorageService],
})
export class FilesModule {}