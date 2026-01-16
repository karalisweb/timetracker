import { Module } from '@nestjs/common';
import { WeeklyController } from './weekly.controller';
import { WeeklyService } from './weekly.service';
import { TimeEntriesModule } from '../time-entries/time-entries.module';
import { DayStatusModule } from '../day-status/day-status.module';

@Module({
  imports: [TimeEntriesModule, DayStatusModule],
  controllers: [WeeklyController],
  providers: [WeeklyService],
  exports: [WeeklyService],
})
export class WeeklyModule {}
