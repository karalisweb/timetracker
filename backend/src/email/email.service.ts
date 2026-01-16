import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP non configurato - le email non verranno inviate');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: port || 25,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.logger.log(`Email service inizializzato con host: ${host}`);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email non inviata a ${to} - SMTP non configurato`);
      return false;
    }

    const from = this.configService.get<string>('SMTP_FROM') || 'Time Report <noreply@karalisweb.net>';

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email inviata a ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Errore invio email a ${to}: ${error.message}`);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string, userName: string): Promise<boolean> {
    const subject = 'Reimposta la tua password - Time Report';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a2e; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #16213e; border-radius: 12px; overflow: hidden;">
    <div style="background-color: #f59e0b; padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: #000; font-size: 24px;">Time Report</h1>
      <p style="margin: 5px 0 0; color: #000; opacity: 0.8;">by Karalisweb</p>
    </div>

    <div style="padding: 40px 30px;">
      <h2 style="color: #fff; margin: 0 0 20px;">Ciao ${userName},</h2>

      <p style="color: #9ca3af; line-height: 1.6; margin: 0 0 20px;">
        Hai richiesto di reimpostare la tua password per Time Report.
        Clicca il pulsante qui sotto per procedere:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background-color: #f59e0b; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Reimposta Password
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
        Questo link scadrà tra <strong style="color: #9ca3af;">1 ora</strong>.
      </p>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 10px 0 0;">
        Se non hai richiesto tu questa operazione, puoi ignorare questa email.
      </p>

      <hr style="border: none; border-top: 1px solid #374151; margin: 30px 0;">

      <p style="color: #4b5563; font-size: 12px; margin: 0;">
        Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
        <a href="${resetLink}" style="color: #f59e0b; word-break: break-all;">${resetLink}</a>
      </p>
    </div>

    <div style="background-color: #0f172a; padding: 20px; text-align: center;">
      <p style="color: #4b5563; font-size: 12px; margin: 0;">
        Karalisweb - Time Report v1.0
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail(to, subject, html);
  }
}
