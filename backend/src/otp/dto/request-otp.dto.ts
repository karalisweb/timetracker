import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO per la richiesta di generazione OTP
 * Riceve l'email dell'utente a cui inviare il codice OTP
 */
export class RequestOtpDto {
  @IsEmail({}, { message: 'Email non valida' })
  @IsNotEmpty({ message: 'Email obbligatoria' })
  email: string;
}
