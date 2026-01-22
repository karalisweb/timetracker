import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { OtpService } from './otp.service';
import { RequestOtpDto, VerifyOtpDto } from './dto';

/**
 * Controller per l'autenticazione a due fattori via OTP email
 *
 * Endpoint disponibili:
 * - POST /auth/request-otp - Richiede invio codice OTP
 * - POST /auth/verify-otp - Verifica codice e ottiene JWT
 *
 * Rate Limiting:
 * - Max 3 richieste OTP per email ogni 15 minuti
 * - Implementato nel servizio OtpService
 *
 * @example
 * ```bash
 * # Richiesta OTP
 * curl -X POST http://localhost:3000/api/auth/request-otp \
 *   -H "Content-Type: application/json" \
 *   -d '{"email": "user@example.com"}'
 *
 * # Verifica OTP
 * curl -X POST http://localhost:3000/api/auth/verify-otp \
 *   -H "Content-Type: application/json" \
 *   -d '{"email": "user@example.com", "code": "123456"}'
 * ```
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class OtpController {
  private readonly logger = new Logger(OtpController.name);

  constructor(private readonly otpService: OtpService) {}

  /**
   * POST /auth/request-otp
   *
   * Richiede l'invio di un codice OTP a 6 cifre via email.
   * Il codice è valido per 10 minuti e può essere usato una sola volta.
   *
   * Rate Limiting: max 3 richieste per email ogni 15 minuti
   *
   * @param requestOtpDto - DTO contenente l'email destinatario
   * @returns Messaggio di conferma con durata validità
   *
   * @example Response
   * ```json
   * {
   *   "message": "Se l'email è registrata, riceverai un codice di verifica.",
   *   "expiresInMinutes": 10
   * }
   * ```
   */
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 richieste al minuto per IP
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    this.logger.log(`Richiesta OTP ricevuta per: ${requestOtpDto.email}`);
    return this.otpService.requestOtp(requestOtpDto);
  }

  /**
   * POST /auth/verify-otp
   *
   * Verifica il codice OTP e restituisce un token JWT se valido.
   * Il codice viene invalidato dopo l'uso.
   *
   * Controlli effettuati:
   * - Esistenza del codice per l'email specificata
   * - Codice non già utilizzato
   * - Codice non scaduto (< 10 minuti)
   *
   * @param verifyOtpDto - DTO con email e codice OTP a 6 cifre
   * @returns Token JWT e dati utente se verifica riuscita
   *
   * @example Response (utente esistente)
   * ```json
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIs...",
   *   "user": {
   *     "id": "uuid",
   *     "email": "user@example.com",
   *     "name": "Mario Rossi",
   *     "roles": ["executor"]
   *   }
   * }
   * ```
   *
   * @example Response (email verificata, utente non esistente)
   * ```json
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIs...",
   *   "user": {
   *     "email": "user@example.com",
   *     "emailVerified": true
   *   }
   * }
   * ```
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Max 10 tentativi al minuto per IP
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    this.logger.log(`Verifica OTP ricevuta per: ${verifyOtpDto.email}`);
    return this.otpService.verifyOtp(verifyOtpDto);
  }
}
