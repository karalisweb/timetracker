import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DayStatusService } from './day-status.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloseDayDto } from './dto/close-day.dto';

@Controller('day-status')
@UseGuards(JwtAuthGuard)
export class DayStatusController {
  constructor(private dayStatusService: DayStatusService) {}

  @Get()
  async getStatus(@Request() req: any, @Query('date') date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.dayStatusService.getStatus(req.user.sub, targetDate);
  }

  @Get('today-summary')
  async getTodaySummary(@Request() req: any) {
    return this.dayStatusService.getTodaySummary(req.user.sub);
  }

  @Post('close')
  async closeDay(@Request() req: any, @Body() closeDayDto: CloseDayDto) {
    const date = closeDayDto.date || new Date().toISOString().split('T')[0];
    return this.dayStatusService.closeDay(req.user.sub, date);
  }

  @Post('reopen')
  async reopenDay(@Request() req: any, @Body() closeDayDto: CloseDayDto) {
    const date = closeDayDto.date || new Date().toISOString().split('T')[0];
    return this.dayStatusService.reopenDay(req.user.sub, date);
  }
}
