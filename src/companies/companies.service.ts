import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { UpdateCompanyDto } from './dto/update-company.dto';


@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  create(data: Partial<Company>) {
    return this.companyModel.create(data);
  }

  activate(id: string) {
    return this.companyModel.findByIdAndUpdate(id, { isActive: true });
  }

  deleteById(id: string) {
    return this.companyModel.findByIdAndDelete(id);
  }
  findById(id: string) {
    return this.companyModel.findById(id);
  }

  update(id: string, data: UpdateCompanyDto) {
    return this.companyModel.findByIdAndUpdate(id, data, { new: true });
  }
}