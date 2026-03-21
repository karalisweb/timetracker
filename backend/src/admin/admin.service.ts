import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateUTC, formatDateUTC, getWeekStartUTC, getWeekEndUTC } from '../common/date.utils';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getComplianceDashboard() {
    const weekStart = getWeekStartUTC();
    const weekEnd = getWeekEndUTC(weekStart);

    // Mostra tutti gli utenti (inclusi admin)
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        dailyTargetMinutes: true,
        workingDays: true,
        roles: true,
      },
      orderBy: { name: 'asc' },
    });

    const compliance = await Promise.all(
      users.map(async (user) => {
        // Giorni chiusi questa settimana
        const closedDays = await this.prisma.dayStatus.count({
          where: {
            userId: user.id,
            date: {
              gte: weekStart,
              lte: weekEnd,
            },
            status: {
              in: ['closed_complete', 'closed_incomplete'],
            },
          },
        });

        // Minuti totali settimana
        const weekEntries = await this.prisma.timeEntry.aggregate({
          where: {
            userId: user.id,
            date: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          _sum: {
            durationMinutes: true,
          },
        });

        // Ultima entry
        const lastEntry = await this.prisma.timeEntry.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, date: true },
        });

        // Settimana inviata
        const weekSubmitted = await this.prisma.weeklySubmission.findUnique({
          where: {
            userId_weekStart: {
              userId: user.id,
              weekStart,
            },
          },
        });

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          closedDaysThisWeek: closedDays,
          workingDaysCount: user.workingDays.length,
          totalMinutesThisWeek: weekEntries._sum.durationMinutes || 0,
          weeklyTargetMinutes: user.dailyTargetMinutes * user.workingDays.length,
          lastEntryDate: lastEntry?.date || null,
          lastEntryCreatedAt: lastEntry?.createdAt || null,
          weekSubmitted: !!weekSubmitted,
          weekSubmittedAt: weekSubmitted?.submittedAt || null,
        };
      }),
    );

    return {
      weekStart: formatDateUTC(weekStart),
      weekEnd: formatDateUTC(weekEnd),
      users: compliance,
    };
  }

  async getUserWeekDetail(userId: string, weekStartStr?: string) {
    const weekStart = weekStartStr
      ? getWeekStartUTC(parseDateUTC(weekStartStr))
      : getWeekStartUTC();
    const weekEnd = getWeekEndUTC(weekStart);

    // Info utente
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        dailyTargetMinutes: true,
        workingDays: true,
      },
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    // Time entries della settimana
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    // Day status della settimana
    const dayStatuses = await this.prisma.dayStatus.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Costruisci i giorni della settimana
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = formatDateUTC(d);

      const dayEntries = entries.filter(
        (e) => formatDateUTC(new Date(e.date)) === dateStr,
      );
      const dayStatus = dayStatuses.find(
        (s) => formatDateUTC(new Date(s.date)) === dateStr,
      );

      const totalMinutes = dayEntries.reduce(
        (sum, e) => sum + e.durationMinutes,
        0,
      );

      days.push({
        date: dateStr,
        dayOfWeek: d.getUTCDay() === 0 ? 7 : d.getUTCDay(),
        totalMinutes,
        targetMinutes: user.dailyTargetMinutes,
        status: dayStatus?.status || 'open',
        entries: dayEntries.map((e) => ({
          id: e.id,
          projectId: e.projectId,
          projectName: e.project.name,
          projectCode: e.project.code,
          durationMinutes: e.durationMinutes,
          notes: e.notes,
          createdAt: e.createdAt,
        })),
      });
    }

    // Settimana inviata?
    const weekSubmission = await this.prisma.weeklySubmission.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dailyTargetMinutes: user.dailyTargetMinutes,
      },
      weekStart: formatDateUTC(weekStart),
      weekEnd: formatDateUTC(weekEnd),
      days,
      totalMinutes: days.reduce((sum, d) => sum + d.totalMinutes, 0),
      weeklyTargetMinutes: user.dailyTargetMinutes * user.workingDays.length,
      weekSubmitted: !!weekSubmission,
      weekSubmittedAt: weekSubmission?.submittedAt || null,
    };
  }

  async exportCsv(from: string, to: string) {
    const fromDate = parseDateUTC(from);
    const toDate = parseDateUTC(to);

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        project: {
          select: { name: true, code: true },
        },
      },
      orderBy: [{ date: 'asc' }, { userId: 'asc' }],
    });

    // Genera CSV
    const header = 'Data,Utente,Email,Progetto,Codice Progetto,Minuti,Note\n';
    const rows = entries
      .map((e) => {
        const date = formatDateUTC(new Date(e.date));
        const notes = e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '';
        return `${date},${e.user.name},${e.user.email},${e.project.name},${e.project.code || ''},${e.durationMinutes},${notes}`;
      })
      .join('\n');

    return header + rows;
  }
}
