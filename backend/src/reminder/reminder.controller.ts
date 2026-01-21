import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ReminderJobService } from './reminder-job.service';
import { SlackService } from './slack.service';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/reminders')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReminderController {
  constructor(
    private readonly reminderJobService: ReminderJobService,
    private readonly slackService: SlackService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  getStatus() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    return {
      environment: nodeEnv,
      cronEnabled: nodeEnv === 'production',
      slack: {
        enabled: this.slackService.isEnabled(),
        hasToken: !!this.configService.get<string>('SLACK_BOT_TOKEN'),
      },
      email: {
        enabled: this.emailService.isEnabled(),
        hasSmtpHost: !!this.configService.get<string>('SMTP_HOST'),
        hasSmtpUser: !!this.configService.get<string>('SMTP_USER'),
        hasSmtpPass: !!this.configService.get<string>('SMTP_PASS'),
      },
      graceMinutes: this.configService.get<number>('REMINDER_GRACE_PERIOD_MINUTES') || 30,
    };
  }

  @Post('trigger/soft')
  async triggerSoft() {
    await this.reminderJobService.triggerSoftReminders();
    return { message: 'Soft reminders eseguiti' };
  }

  @Post('trigger/hard')
  async triggerHard() {
    await this.reminderJobService.triggerHardReminders();
    return { message: 'Hard reminders eseguiti' };
  }

  @Post('trigger/weekly')
  async triggerWeekly() {
    await this.reminderJobService.triggerWeeklyReminders();
    return { message: 'Weekly reminders eseguiti' };
  }

  @Post('test/slack')
  async testSlack() {
    if (!this.slackService.isEnabled()) {
      return { success: false, error: 'Slack non configurato' };
    }

    // Questo è solo un test di connessione, non invia messaggi
    return {
      success: true,
      message: 'Slack configurato correttamente. Usa trigger/soft per inviare reminder.'
    };
  }

  @Post('test/email')
  async testEmail() {
    if (!this.emailService.isEnabled()) {
      return { success: false, error: 'Email non configurato' };
    }

    return {
      success: true,
      message: 'Email configurato correttamente. Usa trigger/hard per inviare reminder.'
    };
  }

  @Post('test/slack/send')
  async testSlackSend(@Body() body: { userId?: string; slackUserId?: string }) {
    if (!this.slackService.isEnabled()) {
      return { success: false, error: 'Slack non configurato' };
    }

    let slackId = body.slackUserId;
    let userName = 'Test User';

    // Se viene passato userId, cerca l'utente nel DB
    if (body.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: body.userId },
        select: { slackUserId: true, name: true },
      });

      if (!user) {
        return { success: false, error: 'Utente non trovato' };
      }

      if (!user.slackUserId) {
        return { success: false, error: 'Utente non ha Slack ID configurato' };
      }

      slackId = user.slackUserId;
      userName = user.name;
    }

    if (!slackId) {
      return { success: false, error: 'slackUserId o userId richiesto' };
    }

    const message = `🔔 *Test Time Report*\n\nCiao ${userName}! Questo è un messaggio di test dal sistema Time Report.\n\n✅ La connessione Slack funziona correttamente!`;

    const sent = await this.slackService.sendDirectMessage(slackId, message);

    return {
      success: sent,
      message: sent ? 'Messaggio di test inviato!' : 'Errore invio messaggio',
      slackUserId: slackId,
    };
  }
}
