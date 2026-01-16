import { IsOptional, IsDateString } from 'class-validator';

export class CloseDayDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
