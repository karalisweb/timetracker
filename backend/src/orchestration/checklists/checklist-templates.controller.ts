import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrchestrationGuard } from '../../auth/guards/orchestration.guard';

@Controller('orchestration/templates')
@UseGuards(JwtAuthGuard, OrchestrationGuard)
export class ChecklistTemplatesController {
  constructor(
    private readonly checklistTemplatesService: ChecklistTemplatesService,
  ) {}

  @Get()
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const onlyActive = activeOnly !== 'false';
    return this.checklistTemplatesService.findAll(onlyActive);
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.checklistTemplatesService.findByCategory(category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.checklistTemplatesService.findOne(id);
  }
}
