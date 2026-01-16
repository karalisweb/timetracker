import { IsString, IsInt, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateTimeEntryDto {
  @IsString()
  projectId: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(1, { message: 'La durata deve essere almeno 1 minuto' })
  durationMinutes: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
