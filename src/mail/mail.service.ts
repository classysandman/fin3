import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: Number(config.get<string>('SMTP_PORT')),
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendActivationEmail(to: string, name: string, token: string) {
    const link = `${this.config.get<string>('APP_URL')}/auth/activate?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to,
      subject: 'Activate your account',
      html: `<p>Hello ${name},</p><p>Click the link below to activate your account:</p><p><a href="${link}">${link}</a></p>`,
    });
  }

    async sendEmployeeInvitation(to: string, companyName: string, token: string) {
    const link = `${this.config.get<string>('FRONTEND_URL')}/activate-employee?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to,
      subject: `You have been invited to ${companyName}`,
      html: `<p>You were added to ${companyName}.</p><p>Open the link below to set your password and activate your account:</p><p><a href="${link}">${link}</a></p><p>Your activation token: <b>${token}</b></p>`,
    });
  }
}