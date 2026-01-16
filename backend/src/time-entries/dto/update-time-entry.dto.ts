import { IsString, IsInt, IsOptional, IsDateString, Min } from 'class-validator';

export class UpdateTimeEntryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'La durata deve essere almeno 1 minuto' })
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
