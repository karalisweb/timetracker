import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrchProjectsService } from './orch-projects.service';
import { CreateOrchProjectDto, ChecklistAssignmentDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrchestrationGuard } from '../../auth/guards/orchestration.guard';
import { ProjectManagerGuard } from '../../auth/guards/project-manager.guard';
import { GateService } from '../gates/gate.service';

@Controller('orchestration/projects')
@UseGuards(JwtAuthGuard, OrchestrationGuard)
export class OrchProjectsController {
  constructor(
    private readonly orchProjectsService: OrchProjectsService,
    private readonly gateService: GateService,
  ) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.orchProjectsService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orchProjectsService.findOne(id);
  }

  @Post()
  @UseGuards(ProjectManagerGuard)
  async create(@Body() dto: CreateOrchProjectDto, @Request() req: any) {
    return this.orchProjectsService.create(dto, req.user.id);
  }

  @Post(':id/checklists')
  @UseGuards(ProjectManagerGuard)
  async addChecklist(
    @Param('id') id: string,
    @Body() dto: ChecklistAssignmentDto,
  ) {
    return this.orchProjectsService.addChecklist(id, dto);
  }

  @Post(':id/retry-sync')
  @UseGuards(ProjectManagerGuard)
  async retrySyncAsana(@Param('id') id: string) {
    return this.orchProjectsService.retrySyncAsana(id);
  }

  @Post(':id/create-asana-tasks')
  @UseGuards(ProjectManagerGuard)
  async createAsanaTasks(@Param('id') id: string) {
    return this.orchProjectsService.createAsanaTasks(id);
  }

  @Post(':id/recalculate-gates')
  @UseGuards(ProjectManagerGuard)
  async recalculateGates(@Param('id') id: string) {
    return this.gateService.recalculateGates(id);
  }

  @Get(':id/gates')
  async getGates(@Param('id') id: string) {
    return this.gateService.getGatesForProject(id);
  }
}
