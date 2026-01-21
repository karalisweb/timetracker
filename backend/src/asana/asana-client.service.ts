import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  assignee?: {
    gid: string;
    name?: string;
  };
  due_on?: string;
  notes?: string;
  custom_fields?: Array<{
    gid: string;
    name: string;
    display_value?: string;
    text_value?: string;
  }>;
}

export interface CreateTaskParams {
  name: string;
  notes?: string;
  assignee?: string;
  due_on?: string;
  projects?: string[];
  custom_fields?: Record<string, string>;
  dependencies?: string[]; // Array of task GIDs that this task depends on
}

export interface UpdateTaskParams {
  name?: string;
  notes?: string;
  assignee?: string;
  due_on?: string;
  completed?: boolean;
  custom_fields?: Record<string, string>;
}

@Injectable()
export class AsanaClientService implements OnModuleInit {
  private readonly logger = new Logger(AsanaClientService.name);
  private accessToken: string;
  private workspaceId: string;
  private defaultProjectId: string;
  private baseUrl = 'https://app.asana.com/api/1.0';
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.accessToken = this.configService.get<string>('ASANA_ACCESS_TOKEN', '');
    this.workspaceId = this.configService.get<string>('ASANA_WORKSPACE_ID', '');
    this.defaultProjectId = this.configService.get<string>(
      'ASANA_DEFAULT_PROJECT_ID',
      '',
    );

    if (this.accessToken && this.workspaceId) {
      this.isConfigured = true;
      this.logger.log('Asana client configurato correttamente');
    } else {
      this.logger.warn(
        'Asana client NON configurato - mancano ASANA_ACCESS_TOKEN o ASANA_WORKSPACE_ID',
      );
    }
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }

  getDefaultProjectId(): string {
    return this.defaultProjectId;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.isConfigured) {
      throw new Error('Asana client non configurato');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify({ data: body });
    }

    this.logger.debug(`Asana API ${method} ${endpoint}`);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.errors?.[0]?.message || `HTTP ${response.status}`;
      this.logger.error(`Asana API error: ${errorMessage}`);
      throw new Error(`Asana API error: ${errorMessage}`);
    }

    return data.data as T;
  }

  async createTask(params: CreateTaskParams): Promise<AsanaTask> {
    const taskData: Record<string, unknown> = {
      name: params.name,
      workspace: this.workspaceId,
    };

    if (params.notes) {
      taskData.notes = params.notes;
    }

    if (params.assignee) {
      taskData.assignee = params.assignee;
    }

    if (params.due_on) {
      taskData.due_on = params.due_on;
    }

    if (params.projects && params.projects.length > 0) {
      taskData.projects = params.projects;
    } else if (this.defaultProjectId) {
      taskData.projects = [this.defaultProjectId];
    }

    if (params.custom_fields) {
      taskData.custom_fields = params.custom_fields;
    }

    const task = await this.request<AsanaTask>('POST', '/tasks', taskData);

    // Add dependencies after task creation (Asana requires this)
    if (params.dependencies && params.dependencies.length > 0) {
      await this.addDependencies(task.gid, params.dependencies);
    }

    return task;
  }

  async addDependencies(taskGid: string, dependencyGids: string[]): Promise<void> {
    for (const depGid of dependencyGids) {
      try {
        await this.request<unknown>(
          'POST',
          `/tasks/${taskGid}/addDependencies`,
          { dependencies: [depGid] },
        );
        this.logger.debug(`Added dependency ${depGid} to task ${taskGid}`);
      } catch (error) {
        this.logger.warn(
          `Failed to add dependency ${depGid} to task ${taskGid}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  async removeDependencies(taskGid: string, dependencyGids: string[]): Promise<void> {
    for (const depGid of dependencyGids) {
      try {
        await this.request<unknown>(
          'POST',
          `/tasks/${taskGid}/removeDependencies`,
          { dependencies: [depGid] },
        );
      } catch (error) {
        this.logger.warn(
          `Failed to remove dependency ${depGid} from task ${taskGid}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  async getDependencies(taskGid: string): Promise<AsanaTask[]> {
    return this.request<AsanaTask[]>(
      'GET',
      `/tasks/${taskGid}/dependencies?opt_fields=gid,name,completed`,
    );
  }

  async updateTask(taskGid: string, params: UpdateTaskParams): Promise<AsanaTask> {
    return this.request<AsanaTask>('PUT', `/tasks/${taskGid}`, params);
  }

  async getTask(taskGid: string): Promise<AsanaTask> {
    return this.request<AsanaTask>(
      'GET',
      `/tasks/${taskGid}?opt_fields=gid,name,completed,assignee,due_on,notes,custom_fields`,
    );
  }

  async completeTask(taskGid: string): Promise<AsanaTask> {
    return this.updateTask(taskGid, { completed: true });
  }

  async reopenTask(taskGid: string): Promise<AsanaTask> {
    return this.updateTask(taskGid, { completed: false });
  }

  async deleteTask(taskGid: string): Promise<void> {
    await this.request<unknown>('DELETE', `/tasks/${taskGid}`);
  }

  async getMe(): Promise<{ gid: string; name: string; email: string }> {
    return this.request<{ gid: string; name: string; email: string }>(
      'GET',
      '/users/me',
    );
  }

  async testConnection(): Promise<{
    success: boolean;
    user?: { gid: string; name: string };
    error?: string;
  }> {
    if (!this.isConfigured) {
      return { success: false, error: 'Asana client non configurato' };
    }

    try {
      const user = await this.getMe();
      return {
        success: true,
        user: { gid: user.gid, name: user.name },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      };
    }
  }
}
