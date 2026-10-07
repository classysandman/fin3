import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, User, UserDocument } from './schemas/user.schema';


@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  findByActivationToken(token: string) {
    return this.userModel
      .findOne({
        activationToken: token,
        activationExpires: { $gt: new Date() },
      })
      .select('+activationToken +activationExpires');
  }

  deleteById(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }

  findByEmailWithPassword(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password');
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }
    findByIdWithPassword(id: string) {
    return this.userModel.findById(id).select('+password');
  }
    countEmployees(companyId: string) {
    return this.userModel.countDocuments({
      company: companyId,
      role: Role.EMPLOYEE,
    });
  }


    findEmployees(companyId: string) {
    return this.userModel
      .find({ company: companyId, role: Role.EMPLOYEE })
      .sort({ createdAt: -1 });
  }

  findEmployeeInCompany(id: string, companyId: string) {
    return this.userModel.findOne({
      _id: id,
      company: companyId,
      role: Role.EMPLOYEE,
    });
  }

    countEmployeesByIds(ids: string[], companyId: string) {
    return this.userModel.countDocuments({
      _id: { $in: ids },
      company: companyId,
      role: Role.EMPLOYEE,
    });
  }
    countActiveEmployees(companyId: string) {
    return this.userModel.countDocuments({
      company: companyId,
      role: Role.EMPLOYEE,
      isActive: true,
    });
  }
}