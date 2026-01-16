import { Module } from '@nestjs/common';
import { DayStatusController } from './day-status.controller';
import { DayStatusService } from './day-status.service';
import { TimeEntriesModule } from '../time-entries/time-entries.module';

@Module({
  imports: [TimeEntriesModule],
  controllers: [DayStatusController],
  providers: [DayStatusService],
  exports: [DayStatusService],
})
export class DayStatusModule {}
