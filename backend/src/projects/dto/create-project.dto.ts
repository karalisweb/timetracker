import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2, { message: 'Nome progetto deve avere almeno 2 caratteri' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
