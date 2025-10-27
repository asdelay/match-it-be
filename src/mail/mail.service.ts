import { BadRequestException, Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });
  }

  async sendEmail(recipientEmail: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: String(process.env.SENDER_EMAIL),
      to: recipientEmail,
      subject,
      html,
    });

    if (!info) throw new BadRequestException('Error while sending email');

    return info;
  }
}
