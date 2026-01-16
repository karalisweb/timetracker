import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
}
