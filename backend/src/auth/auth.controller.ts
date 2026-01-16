import { Controller, Post, Body, Get, Put, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    return { message: 'Logout effettuato' };
  }
}
