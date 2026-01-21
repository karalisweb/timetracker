import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { SlackService } from './slack.service';
import { EmailService } from './email.service';
import { ReminderJobService } from './reminder-job.service';
import { ReminderController } from './reminder.controller';
import { TimeEntriesModule } from '../time-entries/time-entries.module';
import { DayStatusModule } from '../day-status/day-status.module';
import { WeeklyModule } from '../weekly/weekly.module';

@Module({
  imports: [TimeEntriesModule, DayStatusModule, WeeklyModule],
  controllers: [ReminderController],
  providers: [ReminderService, SlackService, EmailService, ReminderJobService],
  exports: [ReminderService, SlackService, EmailService],
})
export class ReminderModule {}
