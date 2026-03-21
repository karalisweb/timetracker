import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { DayStatusService } from '../day-status/day-status.service';
import { parseDateUTC, formatDateUTC, getWeekStartUTC, getWeekEndUTC } from '../common/date.utils';

@Injectable()
export class WeeklyService {
  constructor(
    private prisma: PrismaService,
    private timeEntriesService: TimeEntriesService,
    private dayStatusService: DayStatusService,
  ) {}

  async getCurrentWeekStatus(userId: string, weekStartDate?: string) {
    const weekStart = weekStartDate
      ? getWeekStartUTC(parseDateUTC(weekStartDate))
      : getWeekStartUTC();
    const weekEnd = getWeekEndUTC(weekStart);

    const weekStartStr = formatDateUTC(weekStart);
    const weekEndStr = formatDateUTC(weekEnd);

    // Verifica se la settimana è già stata inviata
    const submission = await this.prisma.weeklySubmission.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    // Ottieni entries della settimana
    const entries = await this.timeEntriesService.findByUserAndDateRange(
      userId,
      weekStartStr,
      weekEndStr,
    );

    // Ottieni stati giornate
    const dayStatuses = await this.dayStatusService.getStatusesByUserAndDateRange(
      userId,
      weekStartStr,
      weekEndStr,
    );

    // Calcola totale minuti
    const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);

    // Calcola giorni per stato
    const dayStatusMap = new Map(
      dayStatuses.map((ds) => [formatDateUTC(new Date(ds.date)), ds.status]),
    );

    // Genera riepilogo giornaliero
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = formatDateUTC(d);
      const dayEntries = entries.filter(
        (e) => formatDateUTC(new Date(e.date)) === dateStr,
      );
      const dayMinutes = dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

      days.push({
        date: dateStr,
        dayOfWeek: d.getUTCDay(),
        minutes: dayMinutes,
        status: dayStatusMap.get(dateStr) || 'open',
        entriesCount: dayEntries.length,
      });
    }

    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      submitted: !!submission,
      submittedAt: submission?.submittedAt || null,
      totalMinutes,
      days,
    };
  }

  async submitWeek(userId: string, weekStartDate?: string) {
    const weekStart = weekStartDate
      ? getWeekStartUTC(parseDateUTC(weekStartDate))
      : getWeekStartUTC();
    const weekEnd = getWeekEndUTC(weekStart);

    // Impedisci invio settimane future
    const currentWeekStart = getWeekStartUTC();
    if (weekStart > currentWeekStart) {
      throw new BadRequestException('Non puoi inviare una settimana futura');
    }

    // Verifica che non sia già stata inviata
    const existing = await this.prisma.weeklySubmission.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Settimana già inviata');
    }

    // Crea submission
    return this.prisma.weeklySubmission.create({
      data: {
        userId,
        weekStart,
        weekEnd,
      },
    });
  }

  async isWeekSubmitted(userId: string, weekStart: Date): Promise<boolean> {
    const submission = await this.prisma.weeklySubmission.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });
    return !!submission;
  }

  async getPreviousWeekStatus(userId: string) {
    const thisWeekStart = getWeekStartUTC();
    const prevWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.isWeekSubmitted(userId, prevWeekStart);
  }
}
