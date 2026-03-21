import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReminderService } from './reminder.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly reminderService: ReminderService) {}

  @Get('pending')
  async getPending(@Request() req: any) {
    return this.reminderService.getPendingAlerts(req.user.sub);
  }
}
