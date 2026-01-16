import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { SlackService } from './slack.service';
import { EmailService } from './email.service';
import { ReminderJobService } from './reminder-job.service';
import { TimeEntriesModule } from '../time-entries/time-entries.module';
import { DayStatusModule } from '../day-status/day-status.module';
import { WeeklyModule } from '../weekly/weekly.module';

@Module({
  imports: [TimeEntriesModule, DayStatusModule, WeeklyModule],
  providers: [ReminderService, SlackService, EmailService, ReminderJobService],
  exports: [ReminderService],
})
export class ReminderModule {}
