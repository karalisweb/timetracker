import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { WeeklyService } from './weekly.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('weekly')
@UseGuards(JwtAuthGuard)
export class WeeklyController {
  constructor(private weeklyService: WeeklyService) {}

  @Get('current')
  async getCurrentWeek(@Request() req: any) {
    return this.weeklyService.getCurrentWeekStatus(req.user.sub);
  }

  @Post('submit')
  async submitWeek(@Request() req: any) {
    return this.weeklyService.submitWeek(req.user.sub);
  }
}
