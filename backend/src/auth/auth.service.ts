import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
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

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      user,
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
