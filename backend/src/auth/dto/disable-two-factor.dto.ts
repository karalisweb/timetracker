import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO per disattivare il 2FA - richiede conferma password
 */
export class DisableTwoFactorDto {
  @IsString({ message: 'Password obbligatoria' })
  @IsNotEmpty({ message: 'Password obbligatoria' })
  password: string;
}
