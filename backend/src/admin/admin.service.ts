import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getComplianceDashboard() {
    const today = new Date();
    const weekStart = this.getWeekStart(today);
    const weekEnd = this.getWeekEnd(weekStart);

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
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      users: compliance,
    };
  }

  async exportCsv(from: string, to: string) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

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
        const date = e.date.toISOString().split('T')[0];
        const notes = e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '';
        return `${date},${e.user.name},${e.user.email},${e.project.name},${e.project.code || ''},${e.durationMinutes},${notes}`;
      })
      .join('\n');

    return header + rows;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private getWeekEnd(weekStart: Date): Date {
    const sunday = new Date(weekStart);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }
}
