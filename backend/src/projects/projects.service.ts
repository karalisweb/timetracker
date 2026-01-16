import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { assignments: true, timeEntries: true },
        },
      },
    });
  }

  async findActive() {
    return this.prisma.project.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Progetto non trovato');
    }

    return project;
  }

  async findAssignedToUser(userId: string) {
    const assignments = await this.prisma.projectAssignment.findMany({
      where: { userId },
      include: {
        project: true,
      },
    });

    return assignments
      .map((a) => a.project)
      .filter((p) => p.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(createDto: CreateProjectDto) {
    if (createDto.code) {
      const existing = await this.prisma.project.findUnique({
        where: { code: createDto.code },
      });
      if (existing) {
        throw new ConflictException('Codice progetto già esistente');
      }
    }

    return this.prisma.project.create({
      data: {
        name: createDto.name,
        code: createDto.code,
        active: createDto.active ?? true,
      },
    });
  }

  async update(id: string, updateDto: UpdateProjectDto) {
    await this.findById(id);

    if (updateDto.code) {
      const existing = await this.prisma.project.findFirst({
        where: {
          code: updateDto.code,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Codice progetto già esistente');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: updateDto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async assignUsers(projectId: string, userIds: string[]) {
    await this.findById(projectId);

    // Rimuovi assegnazioni esistenti
    await this.prisma.projectAssignment.deleteMany({
      where: { projectId },
    });

    // Crea nuove assegnazioni
    if (userIds.length > 0) {
      await this.prisma.projectAssignment.createMany({
        data: userIds.map((userId) => ({
          projectId,
          userId,
        })),
      });
    }

    return this.findById(projectId);
  }
}
