import { IsBoolean, IsEmail, IsOptional, ValidateIf } from 'class-validator';

/**
 * DTO per aggiornare le impostazioni 2FA dell'utente
 */
export class UpdateTwoFactorDto {
  @IsBoolean({ message: 'twoFactorEnabled deve essere un booleano' })
  twoFactorEnabled: boolean;

  @ValidateIf((o) => o.twoFactorEnabled === true)
  @IsEmail({}, { message: 'Email 2FA non valida' })
  @IsOptional()
  twoFactorEmail?: string;
}
