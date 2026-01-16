import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress = this.configService.get<string>('SMTP_FROM') || 'noreply@karalisdemo.it';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Email transporter inizializzato');
    } else {
      this.logger.warn('Configurazione SMTP incompleta - Email disabilitata');
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter non inizializzato');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html: html || text,
      });
      this.logger.log(`Email inviata a ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Errore invio email a ${to}: ${error}`);
      return false;
    }
  }

  async sendHardReminder(email: string, userName: string, minutesLogged: number, targetMinutes: number): Promise<boolean> {
    const subject = 'Time Report - Giornata non chiusa';
    const text = `Ciao ${userName},

La tua giornata lavorativa è terminata ma non hai ancora chiuso il time report.

Hai registrato ${minutesLogged}/${targetMinutes} minuti.

Per favore chiudi la giornata il prima possibile accedendo al Time Report.

---
Time Report MVP
Karalisweb`;

    const html = `
      <h2>Time Report - Reminder</h2>
      <p>Ciao <strong>${userName}</strong>,</p>
      <p>La tua giornata lavorativa è terminata ma non hai ancora chiuso il time report.</p>
      <p>Hai registrato <strong>${minutesLogged}/${targetMinutes} minuti</strong>.</p>
      <p><strong>Per favore chiudi la giornata il prima possibile!</strong></p>
      <hr>
      <p><small>Time Report MVP - Karalisweb</small></p>
    `;

    return this.sendEmail(email, subject, text, html);
  }

  async sendWeeklyReminder(email: string, userName: string): Promise<boolean> {
    const subject = 'Time Report - Settimana non inviata';
    const text = `Ciao ${userName},

Non hai ancora inviato il time report della settimana precedente.

Per favore invia il report settimanale il prima possibile accedendo al Time Report.

---
Time Report MVP
Karalisweb`;

    const html = `
      <h2>Time Report - Reminder Settimanale</h2>
      <p>Ciao <strong>${userName}</strong>,</p>
      <p>Non hai ancora inviato il time report della settimana precedente.</p>
      <p><strong>Per favore invia il report settimanale il prima possibile!</strong></p>
      <hr>
      <p><small>Time Report MVP - Karalisweb</small></p>
    `;

    return this.sendEmail(email, subject, text, html);
  }

  isEnabled(): boolean {
    return this.transporter !== null;
  }
}
