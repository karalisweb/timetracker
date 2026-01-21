import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrchProjectStatus } from '@prisma/client';

export interface GateRequirementStatus {
  templateId: string;
  templateName: string;
  required: boolean;
  assigned: boolean;
  completed: boolean;
}

export interface GateStatus {
  gateId: string;
  gateName: string;
  displayName: string;
  canPass: boolean;
  requirements: GateRequirementStatus[];
}

export interface GateEvaluation {
  gates: GateStatus[];
  previousStatus: OrchProjectStatus;
  newStatus: OrchProjectStatus;
  statusChanged: boolean;
}

@Injectable()
export class GateService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateGates(projectId: string): Promise<GateEvaluation> {
    // 1. Recupera progetto con checklist instances
    const project = await this.prisma.orchProject.findUnique({
      where: { id: projectId },
      include: {
        checklistInstances: {
          include: {
            checklistTemplate: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const previousStatus = project.status;

    // 2. Recupera tutti i gates con requirements
    const gates = await this.prisma.gate.findMany({
      include: {
        requirements: {
          include: {
            checklistTemplate: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // 3. Valuta ogni gate
    const gateStatuses: GateStatus[] = [];
    let previousGatePassed = true;

    for (const gate of gates) {
      const requirements: GateRequirementStatus[] = [];
      let allRequiredCompleted = true;

      for (const req of gate.requirements) {
        // Trova se questa checklist è assegnata al progetto
        const instance = project.checklistInstances.find(
          (ci) => ci.checklistTemplateId === req.checklistTemplateId,
        );

        const assigned = !!instance;
        const completed = instance?.status === 'completed';

        // Determina se è required
        // Se requiredIfAssigned=true, è required solo se assegnata
        // Se requiredIfAssigned=false, è sempre required
        const required = req.requiredIfAssigned ? assigned : true;

        requirements.push({
          templateId: req.checklistTemplateId,
          templateName: req.checklistTemplate.name,
          required,
          assigned,
          completed,
        });

        // Se è required e non completed, il gate non passa
        if (required && !completed) {
          allRequiredCompleted = false;
        }
      }

      // Il gate passa solo se:
      // 1. Il gate precedente è passato
      // 2. Tutti i requirements obbligatori sono completati
      const canPass: boolean = previousGatePassed && allRequiredCompleted;

      gateStatuses.push({
        gateId: gate.id,
        gateName: gate.name,
        displayName: gate.displayName,
        canPass,
        requirements,
      });

      previousGatePassed = canPass;
    }

    // 4. Determina nuovo stato progetto
    const newStatus = this.determineProjectStatus(gateStatuses);

    // 5. Aggiorna stato se cambiato
    if (previousStatus !== newStatus) {
      await this.prisma.orchProject.update({
        where: { id: projectId },
        data: { status: newStatus },
      });
    }

    return {
      gates: gateStatuses,
      previousStatus,
      newStatus,
      statusChanged: previousStatus !== newStatus,
    };
  }

  async recalculateGates(projectId: string): Promise<GateEvaluation> {
    return this.evaluateGates(projectId);
  }

  private determineProjectStatus(
    gateStatuses: GateStatus[],
  ): OrchProjectStatus {
    const publishedGate = gateStatuses.find((g) => g.gateName === 'published');
    const deliveredGate = gateStatuses.find((g) => g.gateName === 'delivered');

    // Se delivered passa → delivered
    if (deliveredGate?.canPass) {
      return OrchProjectStatus.delivered;
    }

    // Se published passa → published
    if (publishedGate?.canPass) {
      return OrchProjectStatus.published;
    }

    // Se tutti i requirements di published sono assegnati
    // ma non tutti completati → ready_for_publish
    if (publishedGate) {
      const allRequiredAssigned = publishedGate.requirements
        .filter((r) => r.required)
        .every((r) => r.assigned);

      if (allRequiredAssigned) {
        return OrchProjectStatus.ready_for_publish;
      }
    }

    // Default
    return OrchProjectStatus.in_development;
  }

  async getGatesForProject(projectId: string): Promise<GateStatus[]> {
    const evaluation = await this.evaluateGates(projectId);
    return evaluation.gates;
  }
}
