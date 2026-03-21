import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { DayStatusService } from '../day-status/day-status.service';
import { WeeklyService } from '../weekly/weekly.service';
import { SlackService } from './slack.service';
import { EmailService } from './email.service';
import { ReminderType, ReminderChannel } from '@prisma/client';
import { getTodayStr, formatDateUTC } from '../common/date.utils';

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

    // Tutti gli utenti che devono fare time report (non solo executor)
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { roles: { has: 'executor' } },
          { roles: { has: 'pm' } },
          { roles: { has: 'senior' } },
        ],
      },
    });

    const today = getTodayStr();

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

    // Tutti gli utenti che devono fare time report (non solo executor)
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { roles: { has: 'executor' } },
          { roles: { has: 'pm' } },
          { roles: { has: 'senior' } },
        ],
      },
    });

    const today = getTodayStr();

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

    // Tutti gli utenti che devono fare time report (non solo executor)
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { roles: { has: 'executor' } },
          { roles: { has: 'pm' } },
          { roles: { has: 'senior' } },
        ],
      },
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

  /**
   * Controlla se il giorno precedente è rimasto aperto e invia sollecito.
   * Eseguito al mattino (es. 9:30) per ricordare di compilare ieri.
   */
  async checkPreviousDayReminders(): Promise<void> {
    this.logger.log('Esecuzione previous-day reminders...');

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { roles: { has: 'executor' } },
          { roles: { has: 'pm' } },
          { roles: { has: 'senior' } },
        ],
      },
    });

    // Calcola la data di ieri
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = formatDateUTC(new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())));
    const yesterdayDayOfWeek = yesterday.getDay(); // 0=Dom

    for (const user of users) {
      try {
        // Salta se ieri non era un giorno lavorativo per l'utente
        const isoDay = yesterdayDayOfWeek === 0 ? 7 : yesterdayDayOfWeek;
        if (!user.workingDays.includes(isoDay)) {
          continue;
        }

        // Verifica se ieri è rimasto aperto
        const isDayClosed = await this.dayStatusService.isDayClosed(user.id, yesterdayStr);
        if (isDayClosed) {
          continue;
        }

        // Verifica minuti registrati ieri
        const minutesLogged = await this.timeEntriesService.getTotalMinutesByUserAndDate(
          user.id,
          yesterdayStr,
        );

        // Invia secondo preferenza canale
        const useSlack =
          user.reminderChannel === 'slack_only' || user.reminderChannel === 'slack_email';
        const useEmail =
          user.reminderChannel === 'email_only' || user.reminderChannel === 'slack_email';

        if (useSlack && user.slackUserId && this.slackService.isEnabled()) {
          const sent = await this.slackService.sendPreviousDayReminder(
            user.slackUserId,
            user.name,
            yesterdayStr,
            minutesLogged,
            user.dailyTargetMinutes,
          );
          if (sent) {
            await this.logReminder(user.id, 'hard', 'slack');
          }
        }

        if (useEmail && this.emailService.isEnabled()) {
          const sent = await this.emailService.sendPreviousDayReminder(
            user.email,
            user.name,
            yesterdayStr,
            minutesLogged,
            user.dailyTargetMinutes,
          );
          if (sent) {
            await this.logReminder(user.id, 'hard', 'email');
          }
        }
      } catch (error) {
        this.logger.error(`Errore previous-day reminder per ${user.email}: ${error}`);
      }
    }

    this.logger.log('Previous-day reminders completati');
  }

  /**
   * Invia un riepilogo agli admin con gli utenti non in regola:
   * - Chi non ha chiuso ieri
   * - Chi non ha inviato la settimana precedente
   */
  async checkAdminNotifications(): Promise<void> {
    this.logger.log('Esecuzione admin notifications...');

    // Trova tutti gli admin
    const admins = await this.prisma.user.findMany({
      where: { roles: { has: 'admin' } },
    });

    if (admins.length === 0) return;

    // Trova tutti gli utenti non-admin
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { roles: { has: 'executor' } },
          { roles: { has: 'pm' } },
          { roles: { has: 'senior' } },
        ],
      },
    });

    // Data di ieri
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = formatDateUTC(new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())));
    const yesterdayDayOfWeek = yesterday.getDay();

    // Trova utenti con ieri non chiuso
    const unclosedYesterday: string[] = [];
    for (const user of users) {
      const isoDay = yesterdayDayOfWeek === 0 ? 7 : yesterdayDayOfWeek;
      if (!user.workingDays.includes(isoDay)) continue;

      const isDayClosed = await this.dayStatusService.isDayClosed(user.id, yesterdayStr);
      if (!isDayClosed) {
        unclosedYesterday.push(user.name);
      }
    }

    // Trova utenti con settimana precedente non inviata
    const weekNotSubmitted: string[] = [];
    for (const user of users) {
      const isPrevWeekSubmitted = await this.weeklyService.getPreviousWeekStatus(user.id);
      if (!isPrevWeekSubmitted) {
        weekNotSubmitted.push(user.name);
      }
    }

    // Se tutto ok, nessuna notifica
    if (unclosedYesterday.length === 0 && weekNotSubmitted.length === 0) {
      this.logger.log('Admin notifications: nessuna anomalia');
      return;
    }

    // Invia a ogni admin
    for (const admin of admins) {
      try {
        if (admin.slackUserId && this.slackService.isEnabled()) {
          await this.slackService.sendAdminNotification(
            admin.slackUserId,
            unclosedYesterday,
            weekNotSubmitted,
            yesterdayStr,
          );
        }

        if (this.emailService.isEnabled()) {
          await this.emailService.sendAdminNotification(
            admin.email,
            admin.name,
            unclosedYesterday,
            weekNotSubmitted,
            yesterdayStr,
          );
        }
      } catch (error) {
        this.logger.error(`Errore admin notification per ${admin.email}: ${error}`);
      }
    }

    this.logger.log('Admin notifications completate');
  }

  /**
   * Restituisce le notifiche pendenti per un utente (usato dal frontend).
   */
  async getPendingAlerts(userId: string): Promise<{
    previousDayOpen: boolean;
    previousDayDate: string | null;
    previousWeekNotSubmitted: boolean;
    // Solo per admin
    adminAlerts?: {
      unclosedYesterday: string[];
      weekNotSubmitted: string[];
    };
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return { previousDayOpen: false, previousDayDate: null, previousWeekNotSubmitted: false };
    }

    // Controlla giorno precedente
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = formatDateUTC(new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())));
    const yesterdayDayOfWeek = yesterday.getDay();
    const isoDay = yesterdayDayOfWeek === 0 ? 7 : yesterdayDayOfWeek;

    let previousDayOpen = false;
    let previousDayDate: string | null = null;

    if (user.workingDays.includes(isoDay)) {
      const isDayClosed = await this.dayStatusService.isDayClosed(userId, yesterdayStr);
      if (!isDayClosed) {
        previousDayOpen = true;
        previousDayDate = yesterdayStr;
      }
    }

    // Controlla settimana precedente
    const previousWeekNotSubmitted = !(await this.weeklyService.getPreviousWeekStatus(userId));

    // Per admin: controlla anche gli altri utenti
    const isAdmin = user.roles.includes('admin');
    let adminAlerts: { unclosedYesterday: string[]; weekNotSubmitted: string[] } | undefined;

    if (isAdmin) {
      const allUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            { roles: { has: 'executor' } },
            { roles: { has: 'pm' } },
            { roles: { has: 'senior' } },
          ],
        },
      });

      const unclosedYesterday: string[] = [];
      const weekNotSubmittedUsers: string[] = [];

      for (const u of allUsers) {
        const uIsoDay = yesterdayDayOfWeek === 0 ? 7 : yesterdayDayOfWeek;
        if (u.workingDays.includes(uIsoDay)) {
          const closed = await this.dayStatusService.isDayClosed(u.id, yesterdayStr);
          if (!closed) unclosedYesterday.push(u.name);
        }
        const submitted = await this.weeklyService.getPreviousWeekStatus(u.id);
        if (!submitted) weekNotSubmittedUsers.push(u.name);
      }

      if (unclosedYesterday.length > 0 || weekNotSubmittedUsers.length > 0) {
        adminAlerts = { unclosedYesterday, weekNotSubmitted: weekNotSubmittedUsers };
      }
    }

    return {
      previousDayOpen,
      previousDayDate,
      previousWeekNotSubmitted,
      adminAlerts,
    };
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
