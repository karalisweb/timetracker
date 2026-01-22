import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RequestOtpDto, VerifyOtpDto } from './dto';

/**
 * Configurazione OTP
 */
const OTP_CONFIG = {
  /** Lunghezza del codice OTP */
  CODE_LENGTH: 6,
  /** Durata validità OTP in minuti */
  EXPIRY_MINUTES: 10,
  /** Numero massimo di richieste OTP per email */
  MAX_REQUESTS: 3,
  /** Finestra temporale per il rate limiting in minuti */
  RATE_LIMIT_WINDOW_MINUTES: 15,
};

/**
 * Servizio per la gestione dell'autenticazione a due fattori via OTP email
 *
 * Funzionalità:
 * - Generazione codici OTP crittograficamente sicuri a 6 cifre
 * - Rate limiting: max 3 richieste per email ogni 15 minuti
 * - Validazione codice con controllo scadenza e utilizzo
 * - Invalidazione automatica dopo l'uso
 * - Generazione token JWT dopo verifica
 *
 * @example
 * ```typescript
 * // Richiesta OTP
 * await otpService.requestOtp({ email: 'user@example.com' });
 *
 * // Verifica OTP
 * const result = await otpService.verifyOtp({
 *   email: 'user@example.com',
 *   code: '123456'
 * });
 * console.log(result.accessToken);
 * ```
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Genera un codice OTP crittograficamente sicuro a 6 cifre
   * Usa crypto.randomInt per garantire uniformità nella distribuzione
   *
   * @returns Codice OTP a 6 cifre come stringa (es: "042857")
   */
  private generateSecureOtpCode(): string {
    // crypto.randomInt genera numeri uniformemente distribuiti
    const code = crypto.randomInt(0, 1000000);
    // Padding a sinistra con zeri per garantire sempre 6 cifre
    return code.toString().padStart(OTP_CONFIG.CODE_LENGTH, '0');
  }

  /**
   * Verifica il rate limiting per una email
   * Controlla che non siano state fatte più di MAX_REQUESTS richieste
   * nella finestra temporale RATE_LIMIT_WINDOW_MINUTES
   *
   * @param email - Email da verificare
   * @throws HttpException (429 Too Many Requests) se il limite è stato superato
   */
  private async checkRateLimit(email: string): Promise<void> {
    const windowStart = new Date(
      Date.now() - OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    );

    const recentRequests = await this.prisma.otpToken.count({
      where: {
        email: email.toLowerCase(),
        createdAt: { gte: windowStart },
      },
    });

    if (recentRequests >= OTP_CONFIG.MAX_REQUESTS) {
      this.logger.warn(
        `Rate limit superato per email: ${email} - ${recentRequests} richieste negli ultimi ${OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES} minuti`,
      );
      throw new HttpException(
        `Troppe richieste. Riprova tra ${OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES} minuti.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Invalida tutti i codici OTP non utilizzati per una email
   * Chiamato prima di generare un nuovo codice per sicurezza
   *
   * @param email - Email per cui invalidare i codici
   */
  private async invalidatePreviousOtps(email: string): Promise<void> {
    await this.prisma.otpToken.updateMany({
      where: {
        email: email.toLowerCase(),
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  /**
   * Richiede l'invio di un nuovo codice OTP via email
   *
   * Processo:
   * 1. Verifica rate limiting
   * 2. Invalida eventuali OTP precedenti non usati
   * 3. Genera nuovo codice sicuro
   * 4. Salva in database con scadenza
   * 5. Invia email con il codice
   *
   * @param requestOtpDto - DTO con email destinatario
   * @returns Messaggio di conferma
   * @throws HttpException (429) se rate limit superato
   */
  async requestOtp(
    requestOtpDto: RequestOtpDto,
  ): Promise<{ message: string; expiresInMinutes: number }> {
    const email = requestOtpDto.email.toLowerCase();

    this.logger.log(`Richiesta OTP per email: ${email}`);

    // 1. Verifica rate limiting
    await this.checkRateLimit(email);

    // 2. Invalida OTP precedenti non utilizzati
    await this.invalidatePreviousOtps(email);

    // 3. Genera nuovo codice OTP sicuro
    const code = this.generateSecureOtpCode();

    // 4. Calcola scadenza (10 minuti)
    const expiresAt = new Date(
      Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000,
    );

    // 5. Salva in database
    await this.prisma.otpToken.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    this.logger.log(
      `OTP generato per ${email} - scade alle ${expiresAt.toISOString()}`,
    );

    // 6. Invia email con il codice OTP
    const emailSent = await this.emailService.sendOtpEmail(email, code);

    if (!emailSent) {
      this.logger.error(`Errore invio email OTP a ${email}`);
      // Non rivelare errori di invio email per sicurezza
    }

    return {
      message: 'Se l\'email è registrata, riceverai un codice di verifica.',
      expiresInMinutes: OTP_CONFIG.EXPIRY_MINUTES,
    };
  }

  /**
   * Verifica un codice OTP e genera un token JWT se valido
   *
   * Controlli effettuati:
   * 1. Esistenza del codice per l'email
   * 2. Codice non già utilizzato
   * 3. Codice non scaduto
   *
   * @param verifyOtpDto - DTO con email e codice OTP
   * @returns Token JWT e dati utente se verifica riuscita
   * @throws BadRequestException se codice invalido, usato o scaduto
   */
  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
  ): Promise<{ accessToken: string; user: any }> {
    const email = verifyOtpDto.email.toLowerCase();
    const { code } = verifyOtpDto;

    this.logger.log(`Tentativo verifica OTP per email: ${email}`);

    // Cerca il token OTP
    const otpToken = await this.prisma.otpToken.findFirst({
      where: {
        email,
        code,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Codice non trovato
    if (!otpToken) {
      this.logger.warn(`OTP non trovato per ${email} con codice ${code}`);
      throw new BadRequestException('Codice OTP non valido');
    }

    // Codice già utilizzato
    if (otpToken.usedAt) {
      this.logger.warn(`OTP già utilizzato per ${email}`);
      throw new BadRequestException('Questo codice è già stato utilizzato');
    }

    // Codice scaduto
    if (otpToken.expiresAt < new Date()) {
      this.logger.warn(`OTP scaduto per ${email}`);
      throw new BadRequestException('Il codice OTP è scaduto');
    }

    // Marca il codice come usato
    await this.prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { usedAt: new Date() },
    });

    this.logger.log(`OTP verificato con successo per ${email}`);

    // Cerca l'utente nel database (se esiste)
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
      },
    });

    // Se l'utente esiste, genera JWT con i suoi dati
    if (user) {
      const payload = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        user,
      };
    }

    // Se l'utente non esiste, genera un JWT temporaneo solo con l'email verificata
    // Utile per flussi di registrazione o accesso con email verificata
    const payload = {
      email,
      emailVerified: true,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: { email, emailVerified: true },
    };
  }

  /**
   * Pulisce i token OTP scaduti dal database
   * Utile per manutenzione periodica (cron job)
   *
   * @returns Numero di token eliminati
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.otpToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    });

    this.logger.log(`Pulizia OTP: ${result.count} token eliminati`);
    return result.count;
  }
}
