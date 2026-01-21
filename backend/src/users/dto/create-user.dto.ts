import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsInt,
  IsEnum,
} from 'class-validator';
import { UserRole, ReminderChannelPreference } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email non valida' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password deve avere almeno 6 caratteri' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Nome deve avere almeno 2 caratteri' })
  name: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

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

  @IsOptional()
  @IsString()
  asanaUserId?: string;
}
