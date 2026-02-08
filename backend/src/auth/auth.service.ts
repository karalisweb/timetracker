import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email o password non validi');
    }

    // Se 2FA è attivo, non restituire token ma richiedere OTP
    if (user.twoFactorEnabled) {
      // Genera e invia OTP
      const otpEmail = user.twoFactorEmail || user.email;
      await this.sendLoginOtp(otpEmail);

      // Genera un token temporaneo per la verifica OTP
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, purpose: '2fa-verification' },
        { expiresIn: '10m' },
      );

      this.logger.log(`2FA richiesto per utente ${user.email}, OTP inviato a ${otpEmail}`);

      return {
        requiresTwoFactor: true,
        tempToken,
        otpEmail: this.maskEmail(otpEmail),
        message: 'Codice OTP inviato. Controlla la tua email.',
      };
    }

    // Login normale senza 2FA
    const payload = { sub: user.id, email: user.email, roles: user.roles };
    return {
      requiresTwoFactor: false,
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
   * Genera e invia OTP per il login 2FA
   */
  private async sendLoginOtp(email: string): Promise<void> {
    // Invalida OTP precedenti
    await this.prisma.otpToken.updateMany({
      where: { email: email.toLowerCase(), usedAt: null },
      data: { usedAt: new Date() },
    });

    // Genera nuovo codice OTP
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minuti

    await this.prisma.otpToken.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });

    // Invia email
    await this.emailService.sendOtpEmail(email, code);
  }

  /**
   * Maschera l'email per privacy (es: a***@gmail.com)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${local[1]}***@${domain}`;
  }

  /**
   * Verifica OTP durante login 2FA e restituisce token completo
   */
  async verifyLoginOtp(verifyDto: VerifyLoginOtpDto) {
    // Verifica il token temporaneo
    let tempPayload: any;
    try {
      tempPayload = this.jwtService.verify(verifyDto.tempToken);
    } catch {
      throw new UnauthorizedException('Sessione scaduta. Effettua nuovamente il login.');
    }

    if (tempPayload.purpose !== '2fa-verification') {
      throw new UnauthorizedException('Token non valido per la verifica 2FA');
    }

    // Verifica OTP
    const user = await this.usersService.findById(tempPayload.sub);
    if (!user) {
      throw new UnauthorizedException('Utente non trovato');
    }

    const otpEmail = (user.twoFactorEmail || user.email).toLowerCase();

    const otpToken = await this.prisma.otpToken.findFirst({
      where: { email: otpEmail, code: verifyDto.code },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpToken) {
      throw new BadRequestException('Codice OTP non valido');
    }

    if (otpToken.usedAt) {
      throw new BadRequestException('Questo codice è già stato utilizzato');
    }

    if (otpToken.expiresAt < new Date()) {
      throw new BadRequestException('Il codice OTP è scaduto');
    }

    // Marca OTP come usato
    await this.prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { usedAt: new Date() },
    });

    this.logger.log(`2FA completato per utente ${user.email}`);

    // Restituisce token completo
    const { passwordHash, ...userWithoutPassword } = user;
    const payload = { sub: user.id, email: user.email, roles: user.roles };

    return {
      user: userWithoutPassword,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utente non trovato');
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utente non trovato');
    }

    // Se vuole cambiare la password, verifica quella attuale
    if (updateProfileDto.password) {
      if (!updateProfileDto.currentPassword) {
        throw new BadRequestException('Password attuale richiesta per modificare la password');
      }
      const isPasswordValid = await bcrypt.compare(updateProfileDto.currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestException('Password attuale non corretta');
      }
    }

    const updateData: any = {};
    if (updateProfileDto.name) {
      updateData.name = updateProfileDto.name;
    }
    if (updateProfileDto.password) {
      updateData.password = updateProfileDto.password;
    }

    const updatedUser = await this.usersService.update(userId, updateData);
    return updatedUser;
  }

  /**
   * Toggle 2FA - Stile GADS Audit
   * Semplice toggle senza password, con email di conferma
   */
  async toggle2FA(userId: string, enabled: boolean) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utente non trovato');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    });

    // Invia email di conferma
    if (enabled) {
      await this.emailService.send2FAEnabledEmail(user.email);
    } else {
      await this.emailService.send2FADisabledEmail(user.email);
    }

    this.logger.log(`2FA ${enabled ? 'attivato' : 'disattivato'} per utente ${user.email}`);

    return {
      message: enabled ? '2FA attivata con successo' : '2FA disattivata con successo',
      twoFactorEnabled: enabled,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    // Per sicurezza, non riveliamo se l'email esiste o meno
    if (!user) {
      return { message: 'Se l\'email esiste nel sistema, riceverai un link per reimpostare la password' };
    }

    // Invalida eventuali token precedenti non usati
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Genera un nuovo token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // In produzione qui invieresti l'email
    // Per ora restituiamo il link (in dev) o solo il messaggio (in prod)
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const baseUrl = isProduction
      ? 'https://timereport.karalisdemo.it'
      : 'http://localhost:5173';

    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    if (!isProduction) {
      // In sviluppo, mostra il link per comodità
      return {
        message: 'Link di reset generato (visibile solo in dev)',
        resetLink,
      };
    }

    // Invia email con il link
    await this.emailService.sendPasswordResetEmail(user.email, resetLink, user.name);

    return { message: 'Se l\'email esiste nel sistema, riceverai un link per reimpostare la password' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: resetPasswordDto.token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Token non valido');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Questo link è già stato utilizzato');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Questo link è scaduto');
    }

    // Aggiorna la password
    await this.usersService.update(resetToken.userId, {
      password: resetPasswordDto.password,
    });

    // Segna il token come usato
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Password aggiornata con successo' };
  }

  async validateResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new BadRequestException('Token non valido');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Questo link è già stato utilizzato');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Questo link è scaduto');
    }

    return { valid: true };
  }
}
