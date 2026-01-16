import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { DayStatusService } from '../day-status/day-status.service';
import { WeeklyService } from '../weekly/weekly.service';
import { SlackService } from './slack.service';
import { EmailService } from './email.service';
import { ReminderType, ReminderChannel } from '@prisma/client';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private prisma: PrismaService,
    private timeEntriesService: TimeEntriesService,
    private dayStatusService: DayStatusService,
    private weeklyService: WeeklyService,
    private slackService: SlackService,
    private emailService: EmailService,
  ) {}

  private isWithinWorkingHours(user: any): boolean {
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1=Lun, 7=Dom

    // Verifica giorno lavorativo
    if (!user.workingDays.includes(currentDay)) {
      return false;
    }

    // Verifica orario
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    return currentTime >= user.workStartTime && currentTime <= user.workEndTime;
  }

  private isAfterWorkingHours(user: any, graceMinutes: number): boolean {
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();

    if (!user.workingDays.includes(currentDay)) {
      return false;
    }

    const [endHours, endMinutes] = user.workEndTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(endHours, endMinutes + graceMinutes, 0, 0);

    return now >= endTime;
  }

  async checkSoftReminders(): Promise<void> {
    this.logger.log('Esecuzione soft reminders...');

    const users = await this.prisma.user.findMany({
      where: { role: 'collaborator' },
    });

    const today = new Date().toISOString().split('T')[0];

    for (const user of users) {
      try {
        // Verifica orario lavorativo
        if (!this.isWithinWorkingHours(user)) {
          continue;
        }

        // Verifica giornata chiusa
        const isDayClosed = await this.dayStatusService.isDayClosed(user.id, today);
        if (isDayClosed) {
          continue;
        }

        // Verifica minuti registrati
        const minutesLogged = await this.timeEntriesService.getTotalMinutesByUserAndDate(
          user.id,
          today,
        );

        if (minutesLogged >= user.dailyTargetMinutes) {
          continue;
        }

        // Invia reminder Slack (solo soft)
        if (user.slackUserId && this.slackService.isEnabled()) {
          const sent = await this.slackService.sendSoftReminder(
            user.slackUserId,
            user.name,
            minutesLogged,
            user.dailyTargetMinutes,
          );

          if (sent) {
            await this.logReminder(user.id, 'soft', 'slack');
          }
        }
      } catch (error) {
        this.logger.error(`Errore soft reminder per ${user.email}: ${error}`);
      }
    }

    this.logger.log('Soft reminders completati');
  }

  async checkHardReminders(graceMinutes: number = 30): Promise<void> {
    this.logger.log('Esecuzione hard reminders...');

    const users = await this.prisma.user.findMany({
      where: { role: 'collaborator' },
    });

    const today = new Date().toISOString().split('T')[0];

    for (const user of users) {
      try {
        // Verifica se siamo dopo fine lavoro + grace
        if (!this.isAfterWorkingHours(user, graceMinutes)) {
          continue;
        }

        // Verifica giornata chiusa
        const isDayClosed = await this.dayStatusService.isDayClosed(user.id, today);
        if (isDayClosed) {
          continue;
        }

        const minutesLogged = await this.timeEntriesService.getTotalMinutesByUserAndDate(
          user.id,
          today,
        );

        // Invia secondo preferenza canale
        const useSlack =
          user.reminderChannel === 'slack_only' || user.reminderChannel === 'slack_email';
        const useEmail =
          user.reminderChannel === 'email_only' || user.reminderChannel === 'slack_email';

        if (useSlack && user.slackUserId && this.slackService.isEnabled()) {
          const sent = await this.slackService.sendHardReminder(
            user.slackUserId,
            user.name,
            minutesLogged,
            user.dailyTargetMinutes,
          );
          if (sent) {
            await this.logReminder(user.id, 'hard', 'slack');
          }
        }

        if (useEmail && this.emailService.isEnabled()) {
          const sent = await this.emailService.sendHardReminder(
            user.email,
            user.name,
            minutesLogged,
            user.dailyTargetMinutes,
          );
          if (sent) {
            await this.logReminder(user.id, 'hard', 'email');
          }
        }
      } catch (error) {
        this.logger.error(`Errore hard reminder per ${user.email}: ${error}`);
      }
    }

    this.logger.log('Hard reminders completati');
  }

  async checkWeeklyReminders(): Promise<void> {
    this.logger.log('Esecuzione weekly reminders...');

    const users = await this.prisma.user.findMany({
      where: { role: 'collaborator' },
    });

    for (const user of users) {
      try {
        // Verifica se settimana precedente inviata
        const isPrevWeekSubmitted = await this.weeklyService.getPreviousWeekStatus(user.id);

        if (isPrevWeekSubmitted) {
          continue;
        }

        // Invia email (principale per weekly)
        if (this.emailService.isEnabled()) {
          const sent = await this.emailService.sendWeeklyReminder(user.email, user.name);
          if (sent) {
            await this.logReminder(user.id, 'weekly', 'email');
          }
        }

        // Opzionale: anche Slack se configurato
        if (user.slackUserId && this.slackService.isEnabled()) {
          const sent = await this.slackService.sendWeeklyReminder(user.slackUserId, user.name);
          if (sent) {
            await this.logReminder(user.id, 'weekly', 'slack');
          }
        }
      } catch (error) {
        this.logger.error(`Errore weekly reminder per ${user.email}: ${error}`);
      }
    }

    this.logger.log('Weekly reminders completati');
  }

  private async logReminder(
    userId: string,
    type: ReminderType,
    channel: ReminderChannel,
  ): Promise<void> {
    await this.prisma.reminderLog.create({
      data: {
        userId,
        reminderType: type,
        channel,
      },
    });
  }
}
