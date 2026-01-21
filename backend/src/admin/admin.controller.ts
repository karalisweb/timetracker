import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { UpdateProjectDto } from '../projects/dto/update-project.dto';
import { AssignUsersDto } from './dto/assign-users.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
    private projectsService: ProjectsService,
  ) {}

  // === USERS ===
  @Get('users')
  async getUsers() {
    return this.usersService.findAll();
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'Utente eliminato' };
  }

  // === PROJECTS ===
  @Get('projects')
  async getProjects() {
    return this.projectsService.findAll();
  }

  @Get('projects/:id')
  async getProject(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post('projects')
  async createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Put('projects/:id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete('projects/:id')
  async deleteProject(@Param('id') id: string) {
    await this.projectsService.delete(id);
    return { message: 'Progetto eliminato' };
  }

  @Post('projects/:id/assign')
  async assignUsers(
    @Param('id') id: string,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.projectsService.assignUsers(id, assignUsersDto.userIds);
  }

  // === COMPLIANCE ===
  @Get('compliance')
  async getComplianceDashboard() {
    return this.adminService.getComplianceDashboard();
  }

  @Get('users/:id/week')
  async getUserWeekDetail(
    @Param('id') userId: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.adminService.getUserWeekDetail(userId, weekStart);
  }

  // === EXPORT ===
  @Get('export')
  async exportCsv(
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const csv = await this.adminService.exportCsv(from, to);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=timesheet_${from}_${to}.csv`,
    );
    res.send(csv);
  }
}
