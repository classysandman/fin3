import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types  } from 'mongoose';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PLANS } from '../subscriptions/plans.config';
import { getBillingPeriod } from '../subscriptions/billing-period.util';
import { Role } from '../users/schemas/user.schema';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { StorageService } from './storage.service';
import {
  FileVisibility,
  StoredFile,
  StoredFileDocument,
} from './schemas/stored-file.schema';
import { UploadFileDto } from './dto/upload-file.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';


@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  constructor(
    @InjectModel(StoredFile.name)
    private fileModel: Model<StoredFileDocument>,
    private usersService: UsersService,
    private subscriptionsService: SubscriptionsService,
    private storageService: StorageService,
  ) {}

  async upload(
    user: JwtPayload,
    file: Express.Multer.File,
    dto: UploadFileDto,
  ) {
    const subscription = await this.subscriptionsService.findByCompany(
      user.companyId,
    );
    if (!subscription) {
      throw new ForbiddenException('Choose a subscription plan first');
    }

    const plan = PLANS[subscription.plan];
    const { start, end } = getBillingPeriod(subscription.activatedAt);
    const used = await this.countInPeriod(user.companyId, start, end);

    if (used >= plan.monthlyFileLimit && plan.overagePricePerFile === 0) {
      throw new ForbiddenException(
        `Monthly limit of ${plan.monthlyFileLimit} files reached. Upgrade your plan to upload more`,
      );
    }

    const visibility = dto.visibility ?? FileVisibility.ALL;
    const allowedUserIds = await this.resolveAllowedUsers(
      user.companyId,
      visibility,
      dto.allowedUserIds,
    );

    const uploader = await this.usersService.findById(user.sub);
    if (!uploader) {
      throw new ForbiddenException();
    }

    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const storageKey = `companies/${user.companyId}/${randomUUID()}${extname(originalName).toLowerCase()}`;

    await this.storageService.upload(storageKey, file.buffer, file.mimetype);

    try {
      const record = await this.fileModel.create({
        company: user.companyId,
        uploadedBy: user.sub,
        uploadedByEmail: uploader.email,
        originalName,
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
        visibility,
        allowedUsers: allowedUserIds,
      });

      return this.fileModel.findById(record.id).select('-storageKey');
    } catch {
      await this.storageService.delete(storageKey);
      throw new InternalServerErrorException('Could not save file');
    }
  }

  list(user: JwtPayload) {
    const filter: QueryFilter<StoredFileDocument> = {
      company: user.companyId,
      deletedAt: null,
    };

    if (user.role !== Role.ADMIN) {
      filter.$or = [
        { visibility: FileVisibility.ALL },
        { allowedUsers: user.sub },
        { uploadedBy: user.sub },
      ];
    }

    return this.fileModel
      .find(filter)
      .select('-storageKey')
      .sort({ createdAt: -1 });
  }
    async getDownloadUrl(user: JwtPayload, id: string) {
    const file = await this.findAccessible(id, user);
    const expiresIn = 300;
    const url = await this.storageService.getDownloadUrl(
      file.storageKey,
      file.originalName,
      expiresIn,
    );
    return { url, expiresIn };
  }

  async updatePermissions(
    user: JwtPayload,
    id: string,
    dto: UpdatePermissionsDto,
  ) {
    const file = await this.findAccessible(id, user);
    this.assertCanManage(file, user);

    file.allowedUsers = (await this.resolveAllowedUsers(
      user.companyId,
      dto.visibility,
      dto.allowedUserIds,
    )) as unknown as typeof file.allowedUsers;
    file.visibility = dto.visibility;
    await file.save();

    return this.fileModel.findById(file.id).select('-storageKey');
  }

  async remove(user: JwtPayload, id: string) {
    const file = await this.findAccessible(id, user);
    this.assertCanManage(file, user);

    file.deletedAt = new Date();
    await file.save();

    try {
      await this.storageService.delete(file.storageKey);
    } catch (error) {
      this.logger.error(`Failed to delete S3 object ${file.storageKey}`, error);
    }

    return { message: 'File deleted' };
  }

  private async resolveAllowedUsers(
    companyId: string,
    visibility: FileVisibility,
    ids?: string[],
  ) {
    if (visibility !== FileVisibility.RESTRICTED) {
      return [];
    }

    const allowed = ids ?? [];
    if (allowed.length) {
      const found = await this.usersService.countEmployeesByIds(
        allowed,
        companyId,
      );
      if (found !== allowed.length) {
        throw new BadRequestException(
          'allowedUserIds must contain only employees of your company',
        );
      }
    }

    return allowed;
  }

  private async findAccessible(id: string, user: JwtPayload) {
    const file = await this.fileModel.findOne({
      _id: id,
      company: user.companyId,
      deletedAt: null,
    });

    if (!file || !this.canView(file, user)) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  private canView(file: StoredFileDocument, user: JwtPayload) {
    if (user.role === Role.ADMIN) {
      return true;
    }
    if (file.visibility === FileVisibility.ALL) {
      return true;
    }
    if (file.uploadedBy?.toString() === user.sub) {
      return true;
    }
    return file.allowedUsers.some((userId) => userId.toString() === user.sub);
  }

  private assertCanManage(file: StoredFileDocument, user: JwtPayload) {
    if (user.role === Role.ADMIN || file.uploadedBy?.toString() === user.sub) {
      return;
    }
    throw new ForbiddenException(
      'Only the uploader or an admin can modify this file',
    );
  }
    countInPeriod(companyId: string, start: Date, end: Date) {
    return this.fileModel.countDocuments({
      company: companyId,
      createdAt: { $gte: start, $lt: end },
    });
  }
    async getStats(companyId: string) {
    const company = new Types.ObjectId(companyId);
    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );

    const [totals, perMonth, topUploaders, byVisibility] = await Promise.all([
      this.fileModel.aggregate<{ files: number; bytes: number }>([
        { $match: { company, deletedAt: null } },
        {
          $group: { _id: null, files: { $sum: 1 }, bytes: { $sum: '$size' } },
        },
      ]),
      this.fileModel.aggregate<{ _id: string; uploaded: number }>([
        { $match: { company, createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            uploaded: { $sum: 1 },
          },
        },
      ]),
      this.fileModel.aggregate<{ _id: string; files: number; bytes: number }>([
        { $match: { company, deletedAt: null } },
        {
          $group: {
            _id: '$uploadedByEmail',
            files: { $sum: 1 },
            bytes: { $sum: '$size' },
          },
        },
        { $sort: { files: -1 } },
        { $limit: 5 },
      ]),
      this.fileModel.aggregate<{ _id: string; files: number }>([
        { $match: { company, deletedAt: null } },
        { $group: { _id: '$visibility', files: { $sum: 1 } } },
      ]),
    ]);

    const counts = new Map(perMonth.map((item) => [item._id, item.uploaded]));
    const uploadsPerMonth = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + index, 1),
      );
      const month = date.toISOString().slice(0, 7);
      return { month, uploaded: counts.get(month) ?? 0 };
    });

    return {
      activeFiles: totals[0]?.files ?? 0,
      storageBytes: totals[0]?.bytes ?? 0,
      uploadsPerMonth,
      topUploaders: topUploaders.map((item) => ({
        email: item._id,
        files: item.files,
        bytes: item.bytes,
      })),
      visibility: {
        all: 0,
        restricted: 0,
        ...Object.fromEntries(byVisibility.map((item) => [item._id, item.files])),
      },
    };
  }
}