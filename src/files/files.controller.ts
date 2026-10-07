import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from './files.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/schemas/activity-log.schema';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(
    private filesService: FilesService,
    private activityService: ActivityService,
  ) {}
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (_req, file, callback) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString(
          'utf8',
        );
        const allowedMimeTypes = ALLOWED_FILE_TYPES[extname(originalName).toLowerCase()];

        if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only csv, xls and xlsx files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.filesService.upload(user, file, dto);

    await this.activityService.log({
      companyId: user.companyId,
      userId: user.sub,
      action: ActivityAction.FILE_UPLOADED,
      details: { fileId: result?.id, name: result?.originalName },
    });

    return result;
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.filesService.list(user);
  }
    @Get(':id/download')
  download(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.filesService.getDownloadUrl(user, id);
  }

  @Patch(':id/permissions')
  async updatePermissions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdatePermissionsDto,
  ) {
    const result = await this.filesService.updatePermissions(user, id, dto);

    await this.activityService.log({
      companyId: user.companyId,
      userId: user.sub,
      action: ActivityAction.FILE_PERMISSIONS_CHANGED,
      details: { fileId: id, visibility: dto.visibility },
    });

    return result;
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const result = await this.filesService.remove(user, id);

    await this.activityService.log({
      companyId: user.companyId,
      userId: user.sub,
      action: ActivityAction.FILE_DELETED,
      details: { fileId: id },
    });

    return result;
  }
}