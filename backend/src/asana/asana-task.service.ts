import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AsanaClientService, AsanaTask } from './asana-client.service';

export interface CreateChecklistTaskParams {
  checklistInstanceId: string;
  orchProjectId: string;
  orchProjectName: string;
  checklistName: string;
  executorAsanaId?: string;
  dueDate?: Date;
}

export interface TaskCreationResult {
  success: boolean;
  asanaTaskId?: string;
  error?: string;
}

@Injectable()
export class AsanaTaskService {
  private readonly logger = new Logger(AsanaTaskService.name);
  private fieldProjectId: string;
  private fieldChecklistId: string;

  constructor(
    private readonly asanaClient: AsanaClientService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.fieldProjectId = this.configService.get<string>(
      'ASANA_FIELD_PROJECT_ID',
      '',
    );
    this.fieldChecklistId = this.configService.get<string>(
      'ASANA_FIELD_CHECKLIST_ID',
      '',
    );
  }

  isEnabled(): boolean {
    return this.asanaClient.isEnabled();
  }

  async createTaskForChecklist(
    params: CreateChecklistTaskParams,
  ): Promise<TaskCreationResult> {
    if (!this.isEnabled()) {
      this.logger.warn('Asana non configurato - task non creato');
      return { success: false, error: 'Asana non configurato' };
    }

    try {
      const taskName = `[${params.orchProjectName}] ${params.checklistName}`;
      const taskNotes = this.buildTaskNotes(params);

      const customFields: Record<string, string> = {};
      if (this.fieldProjectId) {
        customFields[this.fieldProjectId] = params.orchProjectId;
      }
      if (this.fieldChecklistId) {
        customFields[this.fieldChecklistId] = params.checklistInstanceId;
      }

      const asanaTask = await this.asanaClient.createTask({
        name: taskName,
        notes: taskNotes,
        assignee: params.executorAsanaId,
        due_on: params.dueDate
          ? params.dueDate.toISOString().split('T')[0]
          : undefined,
        custom_fields:
          Object.keys(customFields).length > 0 ? customFields : undefined,
      });

      // Salva riferimento task in ExecutionTask
      await this.prisma.executionTask.create({
        data: {
          checklistInstanceId: params.checklistInstanceId,
          asanaTaskId: asanaTask.gid,
          asanaProjectId:
            this.asanaClient.getDefaultProjectId() ||
            this.asanaClient.getWorkspaceId(),
          asanaPayloadSnapshot: JSON.parse(JSON.stringify(asanaTask)),
          syncStatus: 'synced',
        },
      });

      // Aggiorna ChecklistInstance con asanaTaskId
      await this.prisma.checklistInstance.update({
        where: { id: params.checklistInstanceId },
        data: { asanaTaskId: asanaTask.gid },
      });

      this.logger.log(
        `Task Asana creato: ${asanaTask.gid} per checklist ${params.checklistInstanceId}`,
      );

      return {
        success: true,
        asanaTaskId: asanaTask.gid,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Errore sconosciuto';
      this.logger.error(`Errore creazione task Asana: ${errorMessage}`);

      // Registra errore in ExecutionTask per retry
      try {
        await this.prisma.executionTask.create({
          data: {
            checklistInstanceId: params.checklistInstanceId,
            asanaTaskId: `pending_${params.checklistInstanceId}`,
            asanaProjectId:
              this.asanaClient.getDefaultProjectId() ||
              this.asanaClient.getWorkspaceId(),
            asanaPayloadSnapshot: JSON.parse(
              JSON.stringify({
                error: errorMessage,
                params: {
                  checklistInstanceId: params.checklistInstanceId,
                  orchProjectId: params.orchProjectId,
                  orchProjectName: params.orchProjectName,
                  checklistName: params.checklistName,
                },
              }),
            ),
            syncStatus: 'error',
          },
        });
      } catch {
        // Ignora errore di logging
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async createTasksForProject(
    orchProjectId: string,
  ): Promise<{ created: number; failed: number; results: TaskCreationResult[] }> {
    const project = await this.prisma.orchProject.findUnique({
      where: { id: orchProjectId },
      include: {
        checklistInstances: {
          include: {
            checklistTemplate: true,
            executor: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error(`Progetto ${orchProjectId} non trovato`);
    }

    const results: TaskCreationResult[] = [];
    let created = 0;
    let failed = 0;

    for (const instance of project.checklistInstances) {
      // Skip se già ha un task Asana
      if (instance.asanaTaskId) {
        this.logger.debug(
          `Checklist ${instance.id} già ha task Asana: ${instance.asanaTaskId}`,
        );
        continue;
      }

      const result = await this.createTaskForChecklist({
        checklistInstanceId: instance.id,
        orchProjectId: project.id,
        orchProjectName: project.name,
        checklistName: instance.checklistTemplate.name,
        executorAsanaId: instance.executor?.asanaUserId || undefined,
        dueDate: instance.dueDate || undefined,
      });

      results.push(result);
      if (result.success) {
        created++;
      } else {
        failed++;
      }
    }

    return { created, failed, results };
  }

  async syncTaskStatus(asanaTaskGid: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const asanaTask = await this.asanaClient.getTask(asanaTaskGid);
      const executionTask = await this.prisma.executionTask.findUnique({
        where: { asanaTaskId: asanaTaskGid },
        include: { checklistInstance: true },
      });

      if (!executionTask) {
        this.logger.warn(`ExecutionTask non trovato per Asana task ${asanaTaskGid}`);
        return;
      }

      // Aggiorna stato ChecklistInstance basato su completamento task
      const newStatus = asanaTask.completed ? 'completed' : 'pending';
      const currentStatus = executionTask.checklistInstance.status;

      if (
        (newStatus === 'completed' && currentStatus !== 'completed') ||
        (newStatus === 'pending' && currentStatus === 'completed')
      ) {
        await this.prisma.checklistInstance.update({
          where: { id: executionTask.checklistInstanceId },
          data: {
            status: newStatus,
            completedAt: asanaTask.completed ? new Date() : null,
          },
        });

        this.logger.log(
          `Checklist ${executionTask.checklistInstanceId} aggiornata: ${currentStatus} → ${newStatus}`,
        );
      }

      // Aggiorna snapshot
      await this.prisma.executionTask.update({
        where: { id: executionTask.id },
        data: {
          asanaPayloadSnapshot: JSON.parse(JSON.stringify(asanaTask)),
          lastSyncAt: new Date(),
          syncStatus: 'synced',
        },
      });
    } catch (error) {
      this.logger.error(
        `Errore sync task ${asanaTaskGid}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async retryFailedTasks(orchProjectId: string): Promise<{
    retried: number;
    succeeded: number;
    failed: number;
  }> {
    const failedTasks = await this.prisma.executionTask.findMany({
      where: {
        checklistInstance: { orchProjectId },
        syncStatus: 'error',
      },
      include: {
        checklistInstance: {
          include: {
            checklistTemplate: true,
            executor: true,
            orchProject: true,
          },
        },
      },
    });

    let retried = 0;
    let succeeded = 0;
    let failed = 0;

    for (const task of failedTasks) {
      retried++;

      // Elimina il record di errore
      await this.prisma.executionTask.delete({ where: { id: task.id } });

      const result = await this.createTaskForChecklist({
        checklistInstanceId: task.checklistInstanceId,
        orchProjectId: task.checklistInstance.orchProjectId,
        orchProjectName: task.checklistInstance.orchProject.name,
        checklistName: task.checklistInstance.checklistTemplate.name,
        executorAsanaId:
          task.checklistInstance.executor?.asanaUserId || undefined,
        dueDate: task.checklistInstance.dueDate || undefined,
      });

      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    return { retried, succeeded, failed };
  }

  private buildTaskNotes(params: CreateChecklistTaskParams): string {
    const lines = [
      `Checklist: ${params.checklistName}`,
      `Progetto: ${params.orchProjectName}`,
      '',
      '---',
      'Task generato automaticamente dal sistema Orchestration.',
      `ID Progetto: ${params.orchProjectId}`,
      `ID Checklist: ${params.checklistInstanceId}`,
    ];

    return lines.join('\n');
  }
}
