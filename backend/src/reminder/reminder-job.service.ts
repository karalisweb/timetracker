import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import { ReminderService } from './reminder.service';

@Injectable()
export class ReminderJobService implements OnModuleInit {
  private readonly logger = new Logger(ReminderJobService.name);

  constructor(
    private reminderService: ReminderService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      this.scheduleJobs();
    } else {
      this.logger.log('Cron jobs disabilitati in development');
    }
  }

  private scheduleJobs() {
    const graceMinutes = this.configService.get<number>('REMINDER_GRACE_PERIOD_MINUTES') || 30;

    // Soft reminder: ogni 2 ore durante orario lavoro (10, 12, 14, 16)
    cron.schedule('0 10,12,14,16 * * 1-5', async () => {
      this.logger.log('Trigger soft reminders');
      await this.reminderService.checkSoftReminders();
    });

    // Hard reminder: ogni 30 min dopo fine lavoro (17:30, 18:00, 18:30, 19:00, 19:30, 20:00)
    cron.schedule('0,30 17,18,19,20 * * 1-5', async () => {
      this.logger.log('Trigger hard reminders');
      await this.reminderService.checkHardReminders(graceMinutes);
    });

    // Weekly reminder: lunedì alle 9:00
    cron.schedule('0 9 * * 1', async () => {
      this.logger.log('Trigger weekly reminders');
      await this.reminderService.checkWeeklyReminders();
    });

    this.logger.log('Cron jobs schedulati');
  }

  // Metodi per esecuzione manuale (utile per test)
  async triggerSoftReminders() {
    return this.reminderService.checkSoftReminders();
  }

  async triggerHardReminders() {
    const graceMinutes = this.configService.get<number>('REMINDER_GRACE_PERIOD_MINUTES') || 30;
    return this.reminderService.checkHardReminders(graceMinutes);
  }

  async triggerWeeklyReminders() {
    return this.reminderService.checkWeeklyReminders();
  }
}
