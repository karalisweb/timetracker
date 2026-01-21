import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ConfigPanelService } from './config-panel.service';
import { AsanaClientService } from '../asana/asana-client.service';

class UpdateAsanaConfigDto {
  accessToken?: string;
  workspaceId?: string;
  defaultProjectId?: string;
  fieldProjectId?: string;
  fieldChecklistId?: string;
  webhookSecret?: string;
}

@Controller('admin/config')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ConfigPanelController {
  constructor(
    private readonly configService: ConfigPanelService,
    private readonly asanaClient: AsanaClientService,
  ) {}

  @Get('asana')
  async getAsanaConfig() {
    const config = await this.configService.getAsanaConfig();
    return config;
  }

  @Post('asana')
  @HttpCode(200)
  async updateAsanaConfig(@Body() dto: UpdateAsanaConfigDto) {
    await this.configService.setAsanaConfig(dto);
    return {
      success: true,
      message: 'Configurazione Asana aggiornata',
    };
  }

  @Post('asana/test')
  @HttpCode(200)
  async testAsanaConnection() {
    const result = await this.asanaClient.testConnection();
    return result;
  }

  @Get('asana/status')
  async getAsanaStatus() {
    const config = await this.configService.getAsanaConfig();
    const connectionTest = await this.asanaClient.testConnection();

    return {
      configured: config.isConfigured,
      connected: connectionTest.success,
      user: connectionTest.user || null,
      error: connectionTest.error || null,
      config: {
        hasAccessToken: !!config.accessToken,
        hasWorkspaceId: !!config.workspaceId,
        hasDefaultProject: !!config.defaultProjectId,
        hasWebhookSecret: !!config.webhookSecret,
      },
    };
  }
}
