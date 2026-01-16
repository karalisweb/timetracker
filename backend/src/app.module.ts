import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { DayStatusModule } from './day-status/day-status.module';
import { WeeklyModule } from './weekly/weekly.module';
import { AdminModule } from './admin/admin.module';
import { ReminderModule } from './reminder/reminder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TimeEntriesModule,
    DayStatusModule,
    WeeklyModule,
    AdminModule,
    ReminderModule,
  ],
})
export class AppModule {}
