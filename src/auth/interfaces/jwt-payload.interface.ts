import { Request } from 'express';
import { Role } from '../../users/schemas/user.schema';

export interface JwtPayload {
  sub: string;
  companyId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}