import { Controller, Post, Patch, Body, Get, Put, Query, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Verifica OTP durante login con 2FA attivo
   */
  @Post('verify-login-otp')
  async verifyLoginOtp(@Body() verifyLoginOtpDto: VerifyLoginOtpDto) {
    return this.authService.verifyLoginOtp(verifyLoginOtpDto);
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

  /**
   * Toggle 2FA - PATCH /auth/2fa { enabled: boolean }
   * Stile GADS Audit: toggle semplice senza password
   */
  @UseGuards(JwtAuthGuard)
  @Patch('2fa')
  async toggle2FA(@Request() req: any, @Body('enabled') enabled: boolean) {
    return this.authService.toggle2FA(req.user.sub, enabled);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('validate-reset-token')
  async validateResetToken(@Query('token') token: string) {
    return this.authService.validateResetToken(token);
  }
}
