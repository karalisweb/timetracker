import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectManagerGuard } from '../auth/guards/project-manager.guard';
import { AiService, GenerateProjectTasksInput, GenerateProjectTasksOutput } from './ai.service';

class GenerateTasksDto {
  description: string;
  checklistIds: string[];
}

class ParseMentionsDto {
  text: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard, ProjectManagerGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  getStatus() {
    return {
      enabled: this.aiService.isEnabled(),
    };
  }

  @Get('test')
  async testConnection() {
    return this.aiService.testConnection();
  }

  @Post('generate-tasks')
  async generateTasks(
    @Body() dto: GenerateTasksDto,
  ): Promise<GenerateProjectTasksOutput> {
    if (!dto.description || dto.description.trim().length < 10) {
      throw new BadRequestException(
        'La descrizione deve essere di almeno 10 caratteri',
      );
    }

    if (!dto.checklistIds || dto.checklistIds.length === 0) {
      throw new BadRequestException('Seleziona almeno una checklist');
    }

    const input: GenerateProjectTasksInput = {
      description: dto.description.trim(),
      checklistIds: dto.checklistIds,
    };

    return this.aiService.generateProjectTasks(input);
  }

  @Post('parse-mentions')
  async parseMentions(@Body() dto: ParseMentionsDto): Promise<{ checklistIds: string[] }> {
    if (!dto.text) {
      return { checklistIds: [] };
    }

    const checklistIds = await this.aiService.parseChecklistMentions(dto.text);
    return { checklistIds };
  }
}
