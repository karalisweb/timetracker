import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { DayStatusService } from '../day-status/day-status.service';

@Injectable()
export class WeeklyService {
  constructor(
    private prisma: PrismaService,
    private timeEntriesService: TimeEntriesService,
    private dayStatusService: DayStatusService,
  ) {}

  // Ottiene il lunedì della settimana corrente
  private getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Ottiene la domenica della settimana
  private getWeekEnd(weekStart: Date): Date {
    const sunday = new Date(weekStart);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }

  async getCurrentWeekStatus(userId: string) {
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd(weekStart);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

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
      dayStatuses.map((ds) => [ds.date.toISOString().split('T')[0], ds.status]),
    );

    // Genera riepilogo giornaliero
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = entries.filter(
        (e) => e.date.toISOString().split('T')[0] === dateStr,
      );
      const dayMinutes = dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

      days.push({
        date: dateStr,
        dayOfWeek: d.getDay(),
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

  async submitWeek(userId: string) {
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd(weekStart);

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
    const thisWeekStart = this.getWeekStart();
    const prevWeekStart = new Date(thisWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    return this.isWeekSubmitted(userId, prevWeekStart);
  }
}
