import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChecklistTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    return this.prisma.checklistTemplate.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        gateRequirements: {
          include: {
            gate: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        gateRequirements: {
          include: {
            gate: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template con ID ${id} non trovato`);
    }

    return template;
  }

  async findByCategory(category: string) {
    return this.prisma.checklistTemplate.findMany({
      where: {
        category: category as any,
        active: true,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
