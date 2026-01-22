import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * DTO per verificare OTP durante il login con 2FA
 */
export class VerifyLoginOtpDto {
  @IsEmail({}, { message: 'Email non valida' })
  @IsNotEmpty({ message: 'Email obbligatoria' })
  email: string;

  @IsString({ message: 'Codice OTP deve essere una stringa' })
  @IsNotEmpty({ message: 'Codice OTP obbligatorio' })
  @Length(6, 6, { message: 'Il codice OTP deve essere di 6 cifre' })
  @Matches(/^\d{6}$/, { message: 'Il codice OTP deve contenere solo numeri' })
  code: string;

  @IsString({ message: 'Token temporaneo obbligatorio' })
  @IsNotEmpty({ message: 'Token temporaneo obbligatorio' })
  tempToken: string;
}
