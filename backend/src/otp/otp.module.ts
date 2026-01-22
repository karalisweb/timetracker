import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Modulo per l'autenticazione a due fattori via OTP email
 *
 * Funzionalità:
 * - Generazione codici OTP crittograficamente sicuri (6 cifre)
 * - Invio email con template professionale
 * - Rate limiting (max 3 richieste per email ogni 15 minuti)
 * - Verifica e invalidazione codici
 * - Generazione token JWT dopo verifica
 *
 * Endpoint esposti:
 * - POST /auth/request-otp - Richiede invio codice OTP
 * - POST /auth/verify-otp - Verifica codice e ottiene JWT
 *
 * Configurazione SMTP richiesta (variabili d'ambiente):
 * - SMTP_HOST
 * - SMTP_PORT (default: 587)
 * - SMTP_USER
 * - SMTP_PASS
 * - SMTP_FROM
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * import { OtpModule } from './otp/otp.module';
 *
 * @Module({
 *   imports: [OtpModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    PrismaModule,
    // Rate limiting globale: 10 richieste al minuto per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 10, // max 10 richieste
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: '7d' as const,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
