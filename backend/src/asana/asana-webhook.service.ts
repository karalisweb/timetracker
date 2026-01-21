import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AsanaTaskService } from './asana-task.service';
import { GateService } from '../orchestration/gates/gate.service';

interface AsanaEvent {
  user?: { gid: string };
  resource: { gid: string; resource_type: string };
  parent?: { gid: string };
  action: string;
  change?: { field: string; new_value?: any };
}

@Injectable()
export class AsanaWebhookService {
  private readonly logger = new Logger(AsanaWebhookService.name);
  private webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly asanaTaskService: AsanaTaskService,
    private readonly gateService: GateService,
  ) {
    this.webhookSecret = this.configService.get<string>(
      'ASANA_WEBHOOK_SECRET',
      '',
    );
  }

  async verifySignature(payload: string, signature: string): Promise<boolean> {
    if (!this.webhookSecret) {
      this.logger.warn('ASANA_WEBHOOK_SECRET non configurato - skip verifica');
      return true;
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  async processEvents(events: AsanaEvent[]): Promise<void> {
    for (const event of events) {
      try {
        await this.processEvent(event);
      } catch (error) {
        this.logger.error(
          `Errore processing evento ${event.resource.gid}: ${error}`,
        );
      }
    }
  }

  private async processEvent(event: AsanaEvent): Promise<void> {
    const { resource, action, change } = event;

    // Solo eventi su task
    if (resource.resource_type !== 'task') {
      return;
    }

    // Cerca ExecutionTask collegato
    const executionTask = await this.prisma.executionTask.findUnique({
      where: { asanaTaskId: resource.gid },
      include: {
        checklistInstance: {
          include: { orchProject: true },
        },
      },
    });

    if (!executionTask) {
      this.logger.debug(`Task ${resource.gid} non tracciato - ignorato`);
      return;
    }

    // Registra evento per audit
    const eventId = `${resource.gid}_${Date.now()}`;
    await this.prisma.asanaWebhookEvent.create({
      data: {
        asanaEventId: eventId,
        eventType: action,
        resourceGid: resource.gid,
        payload: JSON.parse(JSON.stringify(event)),
        status: 'processing',
      },
    });

    try {
      // Gestisci azioni
      if (action === 'changed' && change?.field === 'completed') {
        await this.handleCompletionChange(
          executionTask,
          change.new_value === true,
        );
      } else if (action === 'deleted') {
        await this.handleTaskDeleted(executionTask);
      }

      // Aggiorna evento come processato
      await this.prisma.asanaWebhookEvent.update({
        where: { asanaEventId: eventId },
        data: { status: 'processed', processedAt: new Date() },
      });
    } catch (error) {
      // Registra errore
      await this.prisma.asanaWebhookEvent.update({
        where: { asanaEventId: eventId },
        data: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  private async handleCompletionChange(
    executionTask: any,
    completed: boolean,
  ): Promise<void> {
    const checklistInstance = executionTask.checklistInstance;
    const newStatus = completed ? 'completed' : 'pending';

    this.logger.log(
      `Task ${executionTask.asanaTaskId} → ${completed ? 'completato' : 'riaperto'}`,
    );

    // Aggiorna ChecklistInstance
    await this.prisma.checklistInstance.update({
      where: { id: checklistInstance.id },
      data: {
        status: newStatus,
        completedAt: completed ? new Date() : null,
      },
    });

    // Sync task status
    await this.asanaTaskService.syncTaskStatus(executionTask.asanaTaskId);

    // Ricalcola gates del progetto
    await this.gateService.evaluateGates(checklistInstance.orchProjectId);

    this.logger.log(
      `Checklist ${checklistInstance.id} aggiornata, gates ricalcolati`,
    );
  }

  private async handleTaskDeleted(executionTask: any): Promise<void> {
    this.logger.warn(
      `Task Asana ${executionTask.asanaTaskId} eliminato - marcato come errore`,
    );

    // Marca ExecutionTask come errore
    await this.prisma.executionTask.update({
      where: { id: executionTask.id },
      data: { syncStatus: 'error' },
    });

    // Rimuovi riferimento da ChecklistInstance
    await this.prisma.checklistInstance.update({
      where: { id: executionTask.checklistInstanceId },
      data: { asanaTaskId: null },
    });
  }
}
