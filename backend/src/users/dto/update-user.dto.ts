import { IsEmail, IsString, MinLength, IsOptional, IsArray, IsInt, IsEnum } from 'class-validator';
import { UserRole, ReminderChannelPreference } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email non valida' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password deve avere almeno 6 caratteri' })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve avere almeno 2 caratteri' })
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  workingDays?: number[];

  @IsOptional()
  @IsString()
  workStartTime?: string;

  @IsOptional()
  @IsString()
  workEndTime?: string;

  @IsOptional()
  @IsInt()
  dailyTargetMinutes?: number;

  @IsOptional()
  @IsString()
  slackUserId?: string;

  @IsOptional()
  @IsEnum(ReminderChannelPreference)
  reminderChannel?: ReminderChannelPreference;
}
