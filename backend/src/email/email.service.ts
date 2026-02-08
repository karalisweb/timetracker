import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const appName = 'KW Time Report';

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

  /**
   * Template base per tutte le email - Stile Karalisweb Design System
   * Sfondo scuro con header logo K gradiente oro/arancione
   */
  private getEmailTemplate(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #0f172a; border-radius: 16px; overflow: hidden;">
          <!-- Header con logo K -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #d4a726, #ff8f65); border-radius: 12px; line-height: 60px; font-size: 28px; font-weight: bold; color: white;">
                K
              </div>
              <h1 style="margin: 15px 0 0; font-size: 24px; font-weight: bold; background: linear-gradient(90deg, #d4a726, #ff8f65); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                ${appName}
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 30px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Questa email è stata inviata automaticamente da ${appName}.<br>
                Se non hai richiesto questa email, puoi ignorarla.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email non inviata a ${to} - SMTP non configurato`);
      return false;
    }

    const from = this.configService.get<string>('SMTP_FROM') || `${appName} <noreply@karalisweb.net>`;

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

  /**
   * Email codice OTP per login 2FA
   * Codice in grande su sfondo gradiente oro/arancione
   */
  async sendOtpEmail(to: string, code: string): Promise<boolean> {
    const content = `
      <h2 style="margin: 0 0 15px; font-size: 20px; color: #f8fafc;">Codice di verifica</h2>
      <p style="margin: 0 0 25px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Usa questo codice per completare l'accesso al tuo account. Il codice scade tra 10 minuti.
      </p>
      <div style="background: linear-gradient(135deg, #d4a726, #ff8f65); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
        <span style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px; font-family: monospace;">
          ${code}
        </span>
      </div>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        Se non hai tentato di accedere, ignora questa email e considera di cambiare la tua password.
      </p>
    `;
    const html = this.getEmailTemplate(content, `Codice di verifica - ${appName}`);
    return this.sendEmail(to, `${code} - Codice di verifica`, html);
  }

  /**
   * Email conferma attivazione 2FA
   */
  async send2FAEnabledEmail(to: string): Promise<boolean> {
    const content = `
      <h2 style="margin: 0 0 15px; font-size: 20px; color: #f8fafc;">2FA Attivato</h2>
      <p style="margin: 0 0 25px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        L'autenticazione a due fattori è stata attivata con successo sul tuo account. D'ora in poi riceverai un codice via email ogni volta che effettuerai l'accesso.
      </p>
      <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 15px; margin-bottom: 25px;">
        <p style="margin: 0; font-size: 14px; color: #22c55e;">
          ✓ Il tuo account è ora più sicuro
        </p>
      </div>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        Se non hai attivato tu questa funzione, contatta immediatamente l'assistenza.
      </p>
    `;
    const html = this.getEmailTemplate(content, `2FA Attivato - ${appName}`);
    return this.sendEmail(to, 'Autenticazione a due fattori attivata', html);
  }

  /**
   * Email conferma disattivazione 2FA
   */
  async send2FADisabledEmail(to: string): Promise<boolean> {
    const content = `
      <h2 style="margin: 0 0 15px; font-size: 20px; color: #f8fafc;">2FA Disattivato</h2>
      <p style="margin: 0 0 25px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        L'autenticazione a due fattori è stata disattivata sul tuo account.
      </p>
      <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 15px; margin-bottom: 25px;">
        <p style="margin: 0; font-size: 14px; color: #fbbf24;">
          ⚠ Il tuo account è meno protetto
        </p>
      </div>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        Ti consigliamo di riattivare il 2FA per proteggere meglio il tuo account.
      </p>
    `;
    const html = this.getEmailTemplate(content, `2FA Disattivato - ${appName}`);
    return this.sendEmail(to, 'Autenticazione a due fattori disattivata', html);
  }

  /**
   * Email per reset password
   */
  async sendPasswordResetEmail(to: string, resetLink: string, userName: string): Promise<boolean> {
    const content = `
      <h2 style="margin: 0 0 15px; font-size: 20px; color: #f8fafc;">Ciao ${userName},</h2>
      <p style="margin: 0 0 25px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Hai richiesto di reimpostare la tua password. Clicca il pulsante qui sotto per procedere.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #d4a726, #ff8f65); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Reimposta Password
        </a>
      </div>
      <p style="margin: 0 0 10px; font-size: 13px; color: #64748b;">
        Questo link scadrà tra <strong style="color: #94a3b8;">1 ora</strong>.
      </p>
      <p style="margin: 0 0 20px; font-size: 13px; color: #64748b;">
        Se non hai richiesto tu questa operazione, puoi ignorare questa email.
      </p>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
      <p style="margin: 0; font-size: 12px; color: #475569;">
        Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
        <a href="${resetLink}" style="color: #d4a726; word-break: break-all;">${resetLink}</a>
      </p>
    `;
    const html = this.getEmailTemplate(content, `Reimposta la tua password - ${appName}`);
    return this.sendEmail(to, 'Reimposta la tua password', html);
  }
}
