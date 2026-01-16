import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get('assigned')
  async getAssigned(@Request() req: any) {
    return this.projectsService.findAssignedToUser(req.user.sub);
  }
}
