import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { DayStatusType } from '@prisma/client';

@Injectable()
export class DayStatusService {
  constructor(
    private prisma: PrismaService,
    private timeEntriesService: TimeEntriesService,
  ) {}

  async getStatus(userId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const status = await this.prisma.dayStatus.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });

    return status || { status: 'open' as DayStatusType, date: targetDate };
  }

  async getTodaySummary(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [totalMinutes, dayStatus, user] = await Promise.all([
      this.timeEntriesService.getTotalMinutesByUserAndDate(userId, today),
      this.getStatus(userId, today),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { dailyTargetMinutes: true },
      }),
    ]);

    return {
      date: today,
      totalMinutes,
      targetMinutes: user?.dailyTargetMinutes || 480,
      status: dayStatus.status,
      isComplete: totalMinutes >= (user?.dailyTargetMinutes || 480),
    };
  }

  async closeDay(userId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Verifica che non sia una data futura
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate > today) {
      throw new BadRequestException('Non puoi chiudere una giornata futura');
    }

    // Calcola minuti e target
    const [totalMinutes, user] = await Promise.all([
      this.timeEntriesService.getTotalMinutesByUserAndDate(userId, date),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { dailyTargetMinutes: true },
      }),
    ]);

    const targetMinutes = user?.dailyTargetMinutes || 480;
    const status: DayStatusType = totalMinutes >= targetMinutes
      ? 'closed_complete'
      : 'closed_incomplete';

    return this.prisma.dayStatus.upsert({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
      create: {
        userId,
        date: targetDate,
        status,
        closedAt: new Date(),
      },
      update: {
        status,
        closedAt: new Date(),
      },
    });
  }

  async reopenDay(userId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return this.prisma.dayStatus.upsert({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
      create: {
        userId,
        date: targetDate,
        status: 'open',
      },
      update: {
        status: 'open',
        closedAt: null,
      },
    });
  }

  async isDayClosed(userId: string, date: string): Promise<boolean> {
    const status = await this.getStatus(userId, date);
    return status.status !== 'open';
  }

  async getStatusesByUserAndDateRange(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.prisma.dayStatus.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    });
  }
}
