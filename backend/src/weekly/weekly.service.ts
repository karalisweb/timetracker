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

  // Parsa una data-stringa come data locale (non UTC)
  private parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Ottiene il lunedì della settimana (ISO: lun=1, dom=7)
  private getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayOfWeek = d.getDay(); // 0=dom, 1=lun, ..., 6=sab
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(d.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Ottiene la domenica della settimana
  private getWeekEnd(weekStart: Date): Date {
    const sunday = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }

  // Formatta una data locale come YYYY-MM-DD senza dipendere da toISOString (che converte in UTC)
  private formatDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async getCurrentWeekStatus(userId: string, weekStartDate?: string) {
    const weekStart = weekStartDate
      ? this.getWeekStart(this.parseLocalDate(weekStartDate))
      : this.getWeekStart();
    const weekEnd = this.getWeekEnd(weekStart);

    const weekStartStr = this.formatDateStr(weekStart);
    const weekEndStr = this.formatDateStr(weekEnd);

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
      dayStatuses.map((ds) => [this.formatDateStr(new Date(ds.date)), ds.status]),
    );

    // Genera riepilogo giornaliero
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      d.setHours(12, 0, 0, 0); // mezzogiorno per evitare problemi DST
      const dateStr = this.formatDateStr(d);
      const dayEntries = entries.filter(
        (e) => this.formatDateStr(new Date(e.date)) === dateStr,
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

  async submitWeek(userId: string, weekStartDate?: string) {
    const weekStart = weekStartDate
      ? this.getWeekStart(this.parseLocalDate(weekStartDate))
      : this.getWeekStart();
    const weekEnd = this.getWeekEnd(weekStart);

    // Impedisci invio settimane future
    const currentWeekStart = this.getWeekStart();
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
    const thisWeekStart = this.getWeekStart();
    const prevWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevWeekStart.setHours(0, 0, 0, 0);

    return this.isWeekSubmitted(userId, prevWeekStart);
  }
}
