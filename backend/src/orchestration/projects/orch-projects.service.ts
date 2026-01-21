import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrchProjectDto, ChecklistAssignmentDto } from './dto';
import { GateService } from '../gates/gate.service';
import { AsanaTaskService } from '../../asana/asana-task.service';

export interface ProjectWarning {
  code: string;
  message: string;
  checklistId?: string;
}

@Injectable()
export class OrchProjectsService {
  private readonly logger = new Logger(OrchProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateService: GateService,
    private readonly asanaTaskService: AsanaTaskService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.orchProject.findMany({
      include: {
        checklistInstances: {
          include: {
            checklistTemplate: true,
            executor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.orchProject.findUnique({
      where: { id },
      include: {
        checklistInstances: {
          include: {
            checklistTemplate: {
              include: { items: true },
            },
            executor: {
              select: { id: true, name: true, email: true, asanaUserId: true },
            },
            owner: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Progetto con ID ${id} non trovato`);
    }

    // Calcola gates
    const gates = await this.gateService.evaluateGates(id);

    return {
      ...project,
      gates,
    };
  }

  async create(dto: CreateOrchProjectDto, createdById: string) {
    const warnings: ProjectWarning[] = [];

    // 1. Validazioni
    await this.validateCreateInput(dto, warnings);

    // 2. Transazione: crea progetto e checklist instances
    const project = await this.prisma.$transaction(async (tx) => {
      // 2a. Crea progetto
      const newProject = await tx.orchProject.create({
        data: {
          name: dto.name,
          code: dto.code,
          decisions: dto.decisions,
          asanaProjectId: dto.asanaProjectId,
          createdById,
        },
      });

      // 2b. Crea checklist instances
      for (const checklist of dto.checklists) {
        const template = await tx.checklistTemplate.findUnique({
          where: { id: checklist.checklistTemplateId },
        });

        if (!template) {
          throw new NotFoundException(
            `Template ${checklist.checklistTemplateId} non trovato`,
          );
        }

        // Verifica executor ha asanaUserId
        if (checklist.executorUserId) {
          const executor = await tx.user.findUnique({
            where: { id: checklist.executorUserId },
          });

          if (executor && !executor.asanaUserId) {
            warnings.push({
              code: 'EXECUTOR_NO_ASANA_MAPPING',
              message: `Executor "${executor.name}" non ha asanaUserId configurato`,
              checklistId: checklist.checklistTemplateId,
            });
          }
        }

        await tx.checklistInstance.create({
          data: {
            orchProjectId: newProject.id,
            checklistTemplateId: checklist.checklistTemplateId,
            templateVersion: template.version,
            executorUserId: checklist.executorUserId || null,
            ownerUserId: checklist.ownerUserId || null,
            dueDate: checklist.dueDate ? new Date(checklist.dueDate) : null,
          },
        });
      }

      return newProject;
    });

    // 3. Verifica checklist obbligatorie mancanti
    const missingChecks = await this.checkMissingRequiredChecklists(
      dto.checklists,
    );
    warnings.push(...missingChecks);

    // 4. Crea task su Asana (async, non blocca la creazione)
    if (this.asanaTaskService.isEnabled()) {
      this.logger.log(`Creazione task Asana per progetto ${project.id}...`);
      const asanaResult = await this.asanaTaskService.createTasksForProject(
        project.id,
      );

      if (asanaResult.failed > 0) {
        warnings.push({
          code: 'ASANA_TASK_CREATION_PARTIAL',
          message: `${asanaResult.failed} task Asana non creati. Usa retry-sync per riprovare.`,
        });
      }

      this.logger.log(
        `Task Asana: ${asanaResult.created} creati, ${asanaResult.failed} falliti`,
      );
    } else {
      warnings.push({
        code: 'ASANA_NOT_CONFIGURED',
        message: 'Asana non configurato - i task verranno creati manualmente o in seguito',
      });
    }

    // 5. Recupera progetto completo con gates
    const fullProject = await this.findOne(project.id);

    return {
      ...fullProject,
      warnings,
    };
  }

  async addChecklist(
    projectId: string,
    checklist: ChecklistAssignmentDto,
  ) {
    const project = await this.prisma.orchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Progetto ${projectId} non trovato`);
    }

    if (project.status === 'delivered') {
      throw new BadRequestException(
        'Non è possibile aggiungere checklist a un progetto consegnato',
      );
    }

    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: checklist.checklistTemplateId },
    });

    if (!template || !template.active) {
      throw new NotFoundException(
        `Template ${checklist.checklistTemplateId} non trovato o non attivo`,
      );
    }

    const instance = await this.prisma.checklistInstance.create({
      data: {
        orchProjectId: projectId,
        checklistTemplateId: checklist.checklistTemplateId,
        templateVersion: template.version,
        executorUserId: checklist.executorUserId || null,
        ownerUserId: checklist.ownerUserId || null,
        dueDate: checklist.dueDate ? new Date(checklist.dueDate) : null,
      },
      include: {
        checklistTemplate: true,
        executor: {
          select: { id: true, name: true, email: true, asanaUserId: true },
        },
      },
    });

    // Crea task Asana per la nuova checklist
    if (this.asanaTaskService.isEnabled()) {
      await this.asanaTaskService.createTaskForChecklist({
        checklistInstanceId: instance.id,
        orchProjectId: project.id,
        orchProjectName: project.name,
        checklistName: instance.checklistTemplate.name,
        executorAsanaId: instance.executor?.asanaUserId || undefined,
        dueDate: instance.dueDate || undefined,
      });
    }

    // Ricalcola gates
    await this.gateService.evaluateGates(projectId);

    return instance;
  }

  async retrySyncAsana(projectId: string) {
    const project = await this.prisma.orchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Progetto ${projectId} non trovato`);
    }

    if (!this.asanaTaskService.isEnabled()) {
      return {
        projectId,
        message: 'Asana non configurato',
        retried: 0,
        succeeded: 0,
        failed: 0,
      };
    }

    const result = await this.asanaTaskService.retryFailedTasks(projectId);

    return {
      projectId,
      message: `Retry completato: ${result.succeeded} successi, ${result.failed} falliti`,
      ...result,
    };
  }

  async createAsanaTasks(projectId: string) {
    const project = await this.prisma.orchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Progetto ${projectId} non trovato`);
    }

    if (!this.asanaTaskService.isEnabled()) {
      return {
        projectId,
        message: 'Asana non configurato',
        created: 0,
        failed: 0,
      };
    }

    const result = await this.asanaTaskService.createTasksForProject(projectId);

    return {
      projectId,
      message: `Creazione completata: ${result.created} creati, ${result.failed} falliti`,
      ...result,
    };
  }

  private async validateCreateInput(
    dto: CreateOrchProjectDto,
    warnings: ProjectWarning[],
  ) {
    // Verifica code unico
    if (dto.code) {
      const existing = await this.prisma.orchProject.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Esiste già un progetto con codice "${dto.code}"`,
        );
      }
    }

    // Verifica templates esistono e sono attivi
    for (const checklist of dto.checklists) {
      const template = await this.prisma.checklistTemplate.findUnique({
        where: { id: checklist.checklistTemplateId },
      });

      if (!template) {
        throw new NotFoundException(
          `Template ${checklist.checklistTemplateId} non trovato`,
        );
      }

      if (!template.active) {
        throw new BadRequestException(
          `Template "${template.name}" non è più attivo`,
        );
      }

      // Verifica executor esiste e ha ruolo executor
      if (checklist.executorUserId) {
        const user = await this.prisma.user.findUnique({
          where: { id: checklist.executorUserId },
        });

        if (!user) {
          throw new NotFoundException(
            `Utente ${checklist.executorUserId} non trovato`,
          );
        }

        if (!user.roles.includes('executor')) {
          throw new BadRequestException(
            `Utente "${user.name}" non ha il ruolo executor`,
          );
        }
      }
    }
  }

  private async checkMissingRequiredChecklists(
    assignedChecklists: ChecklistAssignmentDto[],
  ): Promise<ProjectWarning[]> {
    const warnings: ProjectWarning[] = [];

    // Recupera tutti i gate requirements non "requiredIfAssigned"
    const requirements = await this.prisma.gateRequirement.findMany({
      where: { requiredIfAssigned: false },
      include: {
        gate: true,
        checklistTemplate: true,
      },
    });

    const assignedTemplateIds = assignedChecklists.map(
      (c) => c.checklistTemplateId,
    );

    for (const req of requirements) {
      if (!assignedTemplateIds.includes(req.checklistTemplateId)) {
        warnings.push({
          code: 'MISSING_REQUIRED_CHECKLIST',
          message: `Checklist "${req.checklistTemplate.name}" richiesta per Gate "${req.gate.displayName}" non assegnata`,
        });
      }
    }

    return warnings;
  }
}
