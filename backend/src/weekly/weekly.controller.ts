import { Controller, Get, Post, Query, Body, UseGuards, Request } from '@nestjs/common';
import { WeeklyService } from './weekly.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('weekly')
@UseGuards(JwtAuthGuard)
export class WeeklyController {
  constructor(private weeklyService: WeeklyService) {}

  @Get('current')
  async getCurrentWeek(
    @Request() req: any,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.weeklyService.getCurrentWeekStatus(req.user.sub, weekStart);
  }

  @Post('submit')
  async submitWeek(
    @Request() req: any,
    @Body('weekStart') weekStart?: string,
  ) {
    return this.weeklyService.submitWeek(req.user.sub, weekStart);
  }
}
