import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  BadRequestException,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import passport from 'passport';

import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    const base = { httpOnly: true, sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax', secure: isProd, path: '/' };
    res.cookie('access_token',  accessToken,  { ...base, maxAge: 60 * 60 * 1000 });          // 1 h
    res.cookie('refresh_token', refreshToken, { ...base, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 d
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = ((req.headers['x-forwarded-for'] as string) || req.ip || '').split(',')[0].trim();
    const result = await this.authService.login(dto, ip);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('admin-logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear admin httpOnly cookie session' })
  adminLogout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token',  { path: '/', httpOnly: true });
    res.clearCookie('refresh_token', { path: '/', httpOnly: true });
    return { message: 'Logged out' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token — reads refresh_token from httpOnly cookie or request body' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  async refresh(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Accept token from: httpOnly cookie (preferred) → request body → Authorization header
    const refreshToken: string =
      (req.cookies as Record<string, string>)?.refresh_token ||
      req.body?.refreshToken ||
      (req.headers['authorization'] as string | undefined)?.replace('Bearer ', '') ||
      '';

    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');

    // Verify signature before extracting sub — prevents unsigned token forgery
    let decoded: { sub: number };
    try {
      const jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET', 'sakan-refresh-secret');
      decoded = await this.jwtService.verifyAsync(refreshToken, { secret: jwtRefreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const result = await this.authService.refreshToken(decoded.sub, refreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user (fresh from DB)' })
  async getMe(@CurrentUser() user: UserEntity) {
    const { passwordHash, refreshToken, ...safeUser } = user as any;
    return safeUser;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(
    @CurrentUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('access_token',  { path: '/', httpOnly: true });
    res.clearCookie('refresh_token', { path: '/', httpOnly: true });
    return this.authService.logout(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Send email verification link to the current user' })
  async sendVerificationEmail(@CurrentUser() user: UserEntity) {
    return this.authService.sendEmailVerification(user.id);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address using token (visited from email link)' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.verifyEmail(token);
  }

  // ─── Phone Verification ───────────────────────────────────────────────────

  @Post('send-phone-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Send SMS verification code to the current user\'s phone' })
  async sendPhoneVerification(@CurrentUser() user: UserEntity) {
    return this.authService.sendPhoneVerification(user.id);
  }

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Verify phone number using 6-digit code' })
  async verifyPhone(
    @CurrentUser() user: UserEntity,
    @Body('code') code: string,
  ) {
    return this.authService.verifyPhone(user.id, code);
  }

  // ─── Change Password ──────────────────────────────────────────────────────

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Change password for the current user' })
  async changePassword(
    @CurrentUser() user: UserEntity,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  // ─── Set Password (social / Google users) ────────────────────────────────

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Set a password for accounts created via social login (no existing password)' })
  async setPassword(
    @CurrentUser() user: UserEntity,
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.setPassword(user.id, dto.newPassword);
  }

  // ─── Email Change ─────────────────────────────────────────────────────────

  @Post('request-email-change')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Request email address change (sends verification link to new email)' })
  async requestEmailChange(
    @CurrentUser() user: UserEntity,
    @Body('newEmail') newEmail: string,
  ) {
    if (!newEmail) throw new BadRequestException('newEmail is required');
    return this.authService.requestEmailChange(user.id, newEmail);
  }

  @Get('confirm-email-change')
  @ApiOperation({ summary: 'Confirm email change using token from verification email' })
  async confirmEmailChange(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.confirmEmailChange(token);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  googleAuth() {
    // Guard handles the redirect
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback — redirects to frontend with tokens' })
  googleCallback(@Request() req: any, @Res() res: Response) {
    const frontendUrlRaw = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const frontendUrl = frontendUrlRaw.split(',')[0]?.trim() || 'http://localhost:3000';

    const failSafe = () => {
      if (!res.headersSent) {
        res.redirect(`${frontendUrl}/en/login?error=google_failed`);
      }
    };

    passport.authenticate('google', { session: false }, (err: any, result: any) => {
      if (res.headersSent) return;
      if (err || !result) {
        console.error('[Google OAuth] callback error:', err?.message ?? 'no result');
        return failSafe();
      }

      const { accessToken, refreshToken, user } = result as any;
      const params = new URLSearchParams({
        accessToken,
        refreshToken,
        user: JSON.stringify(user),
      });

      res.redirect(`${frontendUrl}/en/auth/callback?${params.toString()}`);
    })(req, res, failSafe);
  }

  // ─── Validate Reset Token ─────────────────────────────────────────────────

  @Get('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check whether a password-reset token is still valid (non-destructive)' })
  async validateResetToken(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.validateResetToken(token);
  }

  // ─── Google Unlink ────────────────────────────────────────────────────────

  @Delete('google/unlink')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink Google account from user profile (requires password to be set)' })
  async unlinkGoogle(@CurrentUser() user: UserEntity) {
    return this.authService.unlinkGoogle(user.id);
  }

  // ─── TOTP 2FA ─────────────────────────────────────────────────────────────

  @Post('totp/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Generate a TOTP secret and QR code to begin 2FA setup' })
  async setupTotp(@CurrentUser() user: UserEntity) {
    return this.authService.setupTotp(user.id);
  }

  @Post('totp/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Enable 2FA after verifying the TOTP code' })
  async enableTotp(
    @CurrentUser() user: UserEntity,
    @Body('code') code: string,
  ) {
    if (!code) throw new BadRequestException('code is required');
    return this.authService.enableTotp(user.id, code);
  }

  @Post('totp/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Disable 2FA after verifying the current TOTP code' })
  async disableTotp(
    @CurrentUser() user: UserEntity,
    @Body('code') code: string,
  ) {
    if (!code) throw new BadRequestException('code is required');
    return this.authService.disableTotp(user.id, code);
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for the current user' })
  getMySessions(@CurrentUser() user: UserEntity) {
    return this.authService.getMySessions(user.id);
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions for the current user' })
  revokeAllSessions(@CurrentUser() user: UserEntity) {
    return this.authService.revokeAllSessions(user.id);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  revokeSession(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.authService.revokeSession(user.id, id);
  }
}
