import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  async findByUserAndDate(userId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return this.prisma.timeEntry.findMany({
      where: {
        userId,
        date: targetDate,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTotalMinutesByUserAndDate(userId: string, date: string): Promise<number> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const result = await this.prisma.timeEntry.aggregate({
      where: {
        userId,
        date: targetDate,
      },
      _sum: {
        durationMinutes: true,
      },
    });

    return result._sum.durationMinutes || 0;
  }

  async create(userId: string, createDto: CreateTimeEntryDto) {
    // Verifica che l'utente sia assegnato al progetto
    const assignment = await this.prisma.projectAssignment.findUnique({
      where: {
        projectId_userId: {
          projectId: createDto.projectId,
          userId,
        },
      },
    });

    if (!assignment) {
      throw new ForbiddenException('Non sei assegnato a questo progetto');
    }

    const entryDate = new Date(createDto.date);
    entryDate.setHours(0, 0, 0, 0);

    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: createDto.projectId,
        date: entryDate,
        durationMinutes: createDto.durationMinutes,
        notes: createDto.notes,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async update(userId: string, id: string, updateDto: UpdateTimeEntryDto) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Time entry non trovata');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('Non puoi modificare questa entry');
    }

    // Se sta cambiando progetto, verifica assegnazione
    if (updateDto.projectId && updateDto.projectId !== entry.projectId) {
      const assignment = await this.prisma.projectAssignment.findUnique({
        where: {
          projectId_userId: {
            projectId: updateDto.projectId,
            userId,
          },
        },
      });

      if (!assignment) {
        throw new ForbiddenException('Non sei assegnato a questo progetto');
      }
    }

    const data: any = { ...updateDto };
    if (updateDto.date) {
      const entryDate = new Date(updateDto.date);
      entryDate.setHours(0, 0, 0, 0);
      data.date = entryDate;
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async delete(userId: string, id: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Time entry non trovata');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('Non puoi eliminare questa entry');
    }

    return this.prisma.timeEntry.delete({
      where: { id },
    });
  }

  async findByUserAndDateRange(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.prisma.timeEntry.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
