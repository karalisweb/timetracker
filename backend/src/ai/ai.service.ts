import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface GeneratedTask {
  id: string; // Temporary ID for dependency references
  name: string;
  description: string;
  assigneeRole?: string; // Role suggestion (e.g., 'developer', 'designer', 'pm')
  estimatedMinutes?: number;
  dependsOn?: string[]; // IDs of tasks this depends on
  isMilestone?: boolean;
  checklistId?: string; // Reference to checklist template if it's a milestone
}

export interface GeneratedTaskGroup {
  name: string;
  description: string;
  tasks: GeneratedTask[];
  milestoneChecklistId?: string; // Checklist that closes this group
}

export interface GenerateProjectTasksInput {
  description: string;
  checklistIds: string[]; // Selected checklist template IDs
}

export interface GenerateProjectTasksOutput {
  projectName: string;
  projectDescription: string;
  taskGroups: GeneratedTaskGroup[];
  totalTasks: number;
  totalMilestones: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openaiApiKey: string;
  private openaiModel: string;
  private isConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o');

    if (this.openaiApiKey) {
      this.isConfigured = true;
      this.logger.log(`AI Service configurato con modello: ${this.openaiModel}`);
    } else {
      this.logger.warn('AI Service NON configurato - manca OPENAI_API_KEY');
    }
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }

  async generateProjectTasks(
    input: GenerateProjectTasksInput,
  ): Promise<GenerateProjectTasksOutput> {
    if (!this.isConfigured) {
      throw new Error('AI Service non configurato');
    }

    // Fetch checklist templates
    const checklists = await this.prisma.checklistTemplate.findMany({
      where: {
        id: { in: input.checklistIds },
        active: true,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Build system prompt with context
    const systemPrompt = this.buildSystemPrompt(checklists);
    const userPrompt = this.buildUserPrompt(input.description, checklists);

    // Call OpenAI API
    const response = await this.callOpenAI(systemPrompt, userPrompt);

    // Parse and validate response
    return this.parseAIResponse(response, checklists);
  }

  async parseChecklistMentions(text: string): Promise<string[]> {
    // Extract @mentions from text (e.g., "@SEO @Privacy @Performance")
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1].toLowerCase());
    }

    if (mentions.length === 0) {
      return [];
    }

    // Find matching checklist templates
    const templates = await this.prisma.checklistTemplate.findMany({
      where: {
        active: true,
        OR: mentions.map((m) => ({
          name: {
            contains: m,
            mode: 'insensitive' as const,
          },
        })),
      },
      select: { id: true },
    });

    return templates.map((t) => t.id);
  }

  private buildSystemPrompt(
    checklists: Array<{
      id: string;
      name: string;
      category: string;
      items: Array<{ label: string; description: string | null }>;
    }>,
  ): string {
    const checklistDescriptions = checklists
      .map((c) => {
        const items = c.items.map((i) => `  - ${i.label}`).join('\n');
        return `### ${c.name} (${c.category})\n${items}`;
      })
      .join('\n\n');

    return `Sei un Project Manager esperto di web agency. Il tuo compito è generare una lista strutturata di task per un progetto web basandoti sulla descrizione fornita.

## Checklist Disponibili
Le seguenti checklist devono essere usate come milestone finali per gruppi di task correlati:

${checklistDescriptions}

## Regole di Output
1. Organizza i task in gruppi logici (es. "Setup Iniziale", "Frontend", "Backend", "Testing")
2. Ogni checklist selezionata diventa una MILESTONE che chiude il gruppo correlato
3. I task devono avere dipendenze logiche (es. "Design UI" prima di "Sviluppo Frontend")
4. Assegna ruoli suggeriti: developer, designer, pm, devops, qa
5. Stima i minuti per ogni task (multipli di 30)
6. Non creare task troppo granulari - mantieni un livello di astrazione pratico
7. La milestone finale dipende dal completamento di tutti i task del gruppo

## Formato Output JSON
{
  "projectName": "Nome sintetico del progetto",
  "projectDescription": "Descrizione breve",
  "taskGroups": [
    {
      "name": "Nome Gruppo",
      "description": "Descrizione gruppo",
      "tasks": [
        {
          "id": "task_1",
          "name": "Nome Task",
          "description": "Descrizione dettagliata",
          "assigneeRole": "developer",
          "estimatedMinutes": 120,
          "dependsOn": [],
          "isMilestone": false
        }
      ],
      "milestoneChecklistId": "uuid-checklist-se-applicabile"
    }
  ]
}`;
  }

  private buildUserPrompt(
    description: string,
    checklists: Array<{ id: string; name: string }>,
  ): string {
    const checklistNames = checklists.map((c) => c.name).join(', ');
    return `Genera i task per il seguente progetto:

${description}

Checklist da applicare come milestone: ${checklistNames}

Rispondi SOLO con il JSON, senza markdown o altro testo.`;
  }

  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.openaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      this.logger.error(`OpenAI API error: ${JSON.stringify(error)}`);
      throw new Error(`OpenAI API error: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private parseAIResponse(
    responseText: string,
    checklists: Array<{ id: string; name: string }>,
  ): GenerateProjectTasksOutput {
    try {
      // Remove potential markdown code blocks
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }

      const parsed = JSON.parse(jsonText.trim());

      // Validate structure
      if (!parsed.taskGroups || !Array.isArray(parsed.taskGroups)) {
        throw new Error('Invalid response structure: missing taskGroups');
      }

      // Calculate totals
      let totalTasks = 0;
      let totalMilestones = 0;

      for (const group of parsed.taskGroups) {
        if (group.tasks && Array.isArray(group.tasks)) {
          totalTasks += group.tasks.length;
          totalMilestones += group.tasks.filter((t: GeneratedTask) => t.isMilestone).length;
        }
        if (group.milestoneChecklistId) {
          totalMilestones++;
        }
      }

      return {
        projectName: parsed.projectName || 'Nuovo Progetto',
        projectDescription: parsed.projectDescription || '',
        taskGroups: parsed.taskGroups,
        totalTasks,
        totalMilestones,
      };
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error}`);
      this.logger.debug(`Raw response: ${responseText}`);
      throw new Error('Errore nel parsing della risposta AI');
    }
  }

  async testConnection(): Promise<{
    success: boolean;
    model?: string;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return { success: false, error: 'AI Service non configurato' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        success: true,
        model: this.openaiModel,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      };
    }
  }
}
