import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve avere almeno 2 caratteri' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password deve avere almeno 6 caratteri' })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password attuale richiesta' })
  currentPassword?: string;
}
