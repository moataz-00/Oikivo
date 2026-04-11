import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, MoreThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.entity';
import { PasswordResetEntity } from '../entities/password-reset.entity';
import { VerificationTokenEntity } from '../entities/verification-token.entity';
import { AdminActivityLogEntity } from '../entities/admin-activity-log.entity';
import { UserSessionEntity } from '../entities/user-session.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { authenticator } from 'otplib';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService, tplEmailVerification, tplPasswordReset, tplPhoneOtp, tplConfirmEmailChange } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    @InjectRepository(PasswordResetEntity)
    private passwordResetRepo: Repository<PasswordResetEntity>,
    @InjectRepository(VerificationTokenEntity)
    private verificationTokenRepo: Repository<VerificationTokenEntity>,
    @InjectRepository(AdminActivityLogEntity)
    private activityLogRepo: Repository<AdminActivityLogEntity>,
    @InjectRepository(UserSessionEntity)
    private sessionRepo: Repository<UserSessionEntity>,
    private jwtService: JwtService,
    private config: ConfigService,
    private mail: MailService,
    private sms: SmsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      preferredLanguage: dto.preferredLanguage || 'en',
    });

    const saved = await this.usersRepo.save(user);
    const tokens = await this.generateTokens(saved);
    await this.saveRefreshToken(saved.id, tokens.refreshToken);

    // Auto-send verification email (non-blocking — failure must not block registration)
    this.sendEmailVerification(saved.id).catch(() => {/* best-effort */});

    return {
      user: this.sanitizeUser(saved),
      ...tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string) {
    let loginUser: UserEntity | null = null;
    try {
      const user = await this.usersRepo.findOne({
        where: { email: dto.email },
        select: [
          'id', 'email', 'passwordHash', 'firstName', 'lastName',
          'avatarUrl', 'isHost', 'isSuperhost', 'isAdmin', 'isActive',
          'preferredLanguage', 'phone', 'bio', 'dateOfBirth',
          'isEmailVerified', 'isPhoneVerified', 'isIdVerified',
          'createdAt', 'updatedAt', 'isConsultant', 'isTotpEnabled', 'totpSecret',
        ],
      });

      if (!user) throw new UnauthorizedException('Invalid credentials');
      loginUser = user;
      if (!user.isActive) throw new UnauthorizedException('Account is disabled');
      if (!user.isEmailVerified) throw new UnauthorizedException('Please verify your email before logging in');
      if (!user.passwordHash) throw new UnauthorizedException('Please use social login');

      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');

      // 2FA TOTP check
      if (user.isTotpEnabled) {
        if (!dto.totpCode) {
          return { requiresTotp: true } as any;
        }
        const isValidTotp = authenticator.verify({ token: dto.totpCode, secret: user.totpSecret! });
        if (!isValidTotp) throw new UnauthorizedException('Invalid 2FA code');
      }

      const tokens = await this.generateTokens(user);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      // Save session record for session management (best-effort)
      this.sessionRepo
        .save(
          this.sessionRepo.create({
            userId: user.id,
            ipAddress: ipAddress ?? null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days like refresh token
          }),
        )
        .catch(() => {/* non-blocking */});

      // Update last login timestamp (best-effort)
      this.usersRepo.update(user.id, { lastLoginAt: new Date() } as any).catch(() => {});

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        // Best-effort: log failed login to the admin activity log
        this.activityLogRepo
          .save(
            this.activityLogRepo.create({
              adminId: null as any,
              action: 'AUTH_FAILED_LOGIN',
              entityType: 'auth',
              details: {
                email: dto.email,
                reason: (err as Error).message,
                userId: loginUser?.id ?? null,
              },
              ipAddress: ipAddress ?? null,
            }),
          )
          .catch(() => {/* non-blocking */});
      }
      throw err;
    }
  }

  async refreshToken(userId: number, refreshToken: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: [
        'id', 'email', 'firstName', 'lastName', 'avatarUrl',
        'isHost', 'isSuperhost', 'isAdmin', 'isActive',
        'preferredLanguage', 'refreshToken', 'isConsultant',
      ],
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const rtMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!rtMatch) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: number) {
    await this.usersRepo.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    // Expire old tokens for this user
    await this.passwordResetRepo.delete({ userId: user.id });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.passwordResetRepo.save(
      this.passwordResetRepo.create({ userId: user.id, token, expiresAt }),
    );

    const frontendUrlRaw = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const frontendUrl = frontendUrlRaw.split(',')[0]?.trim() || 'http://localhost:3000';
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/en/reset-password?token=${encodeURIComponent(token)}`;

    await this.mail.send(user.email, 'Reset your password — Oikivo', tplPasswordReset(user.firstName, resetUrl));

    return {
      message: 'If that email exists, a reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const record = await this.passwordResetRepo.findOne({
      where: {
        token: dto.token,
        usedAt: null as any,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.usersRepo.update(record.userId, { passwordHash, refreshToken: null });
    await this.passwordResetRepo.update(record.id, { usedAt: new Date() });

    return { message: 'Password reset successful. Please log in.' };
  }

  async generateTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email };
    const jwtSecret = this.config.get('JWT_SECRET', 'sakan-secret');
    const jwtRefreshSecret = this.config.get('JWT_REFRESH_SECRET', 'sakan-refresh-secret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: '30d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: number, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update(userId, { refreshToken: hashed });
  }

  private sanitizeUser(user: UserEntity) {
    const { passwordHash, refreshToken, ...rest } = user as any;
    return rest;
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  async googleLogin(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }) {
    if (!profile.email) {
      throw new BadRequestException('No email returned from Google. Please allow email access.');
    }

    // Check if user already exists by google_id or email
    let user = await this.usersRepo.findOne({
      where: [{ googleId: profile.googleId }, { email: profile.email }],
    });

    if (!user) {
      // New user — create account (email auto-verified since Google confirms it)
      const newUser = this.usersRepo.create({
        googleId: profile.googleId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl ?? undefined,
        isEmailVerified: true,
        isActive: true,
      } as unknown as UserEntity);
      user = await this.usersRepo.save(newUser);
    } else {
      // Existing user — link Google ID if not already set
      const updates: Partial<UserEntity> = {};
      if (!user.googleId) updates.googleId = profile.googleId;
      if (!user.avatarUrl && profile.avatarUrl) updates.avatarUrl = profile.avatarUrl;
      if (!user.isEmailVerified) updates.isEmailVerified = true;
      if (Object.keys(updates).length) {
        await this.usersRepo.update(user.id, updates as any);
        Object.assign(user, updates);
      }
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── Email Verification ────────────────────────────────────────────────────

  async sendEmailVerification(userId: number): Promise<{ message: string; devToken?: string }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) return { message: 'Email is already verified' };

    // Invalidate existing tokens
    await this.verificationTokenRepo.delete({ userId, type: 'email' });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await this.verificationTokenRepo.save(
      this.verificationTokenRepo.create({ userId, type: 'email', token, expiresAt }),
    );

    const frontendUrlRaw = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const frontendUrl = frontendUrlRaw.split(',')[0]?.trim() || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/en/auth/verify-email?token=${encodeURIComponent(token)}`;

    await this.mail.send(user.email, 'Verify your email — Oikivo', tplEmailVerification(user.firstName, verifyUrl));

    return { message: 'Verification email sent.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const record = await this.verificationTokenRepo.findOne({
      where: { token, type: 'email', usedAt: null as any, expiresAt: MoreThan(new Date()) },
    });
    if (!record) throw new BadRequestException('Invalid or expired verification token');

    await this.usersRepo.update(record.userId, { isEmailVerified: true });
    await this.verificationTokenRepo.update(record.id, { usedAt: new Date() });

    return { message: 'Email verified successfully' };
  }

  // ─── Phone Verification ────────────────────────────────────────────────────

  async sendPhoneVerification(userId: number): Promise<{ message: string; devCode?: string }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.phone) throw new BadRequestException('No phone number on your account. Please add a phone number first.');
    if (user.isPhoneVerified) return { message: 'Phone is already verified' };

    // ── SMS consumption guards ────────────────────────────────────────────
    // 1. Cooldown: if a valid token was requested < 2 minutes ago, do NOT send
    //    a new SMS — just tell the user the code is on its way.
    const cooldownCutoff = new Date(Date.now() - 2 * 60 * 1000);
    const recentToken = await this.verificationTokenRepo.findOne({
      where: {
        userId,
        type: 'phone',
        usedAt: null as any,
        expiresAt: MoreThan(new Date()),
        createdAt: MoreThanOrEqual(cooldownCutoff),
      },
    });
    if (recentToken) {
      const secsLeft = Math.ceil((recentToken.createdAt.getTime() + 2 * 60 * 1000 - Date.now()) / 1000);
      return { message: `Code already sent. Please wait ${secsLeft} seconds before requesting a new one.` };
    }

    // 2. Daily cap: max 3 SMS per user per day (resets at midnight UTC)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const todayCount = await this.verificationTokenRepo.count({
      where: { userId, type: 'phone', createdAt: MoreThanOrEqual(startOfDay) },
    });
    if (todayCount >= 3) {
      throw new BadRequestException('Daily OTP limit reached. Please try again tomorrow or contact support.');
    }

    // ── Delete previous unused tokens and create a new one ────────────────
    await this.verificationTokenRepo.delete({ userId, type: 'phone' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.verificationTokenRepo.save(
      this.verificationTokenRepo.create({ userId, type: 'phone', token: code, expiresAt }),
    );

    const isDev = this.config.get('NODE_ENV', 'development') === 'development';
    const whysmsConfigured = !!(this.config.get('WHYSMS_USERNAME') && this.config.get('WHYSMS_PASSWORD'));

    if (!isDev && whysmsConfigured) {
      // ── Production: send via WhySMS ────────────────────────────────────
      const message = `Your Oikivo verification code is: ${code}. Valid for 10 minutes. Do not share it with anyone.`;
      try {
        await this.sms.send(user.phone!, message);
      } catch (err: any) {
        // SMS delivery failure — fall back to email so the user isn't blocked
        this.sms['logger']?.warn?.(`SMS failed for user ${userId}, falling back to email: ${err.message}`);
        await this.mail.send(user.email, 'Your verification code — Oikivo', tplPhoneOtp(user.firstName, user.phone!, code));
      }
      return { message: 'Verification code sent to your phone number.' };
    }

    // ── Development / no SMS provider: send via email ─────────────────────
    await this.mail.send(user.email, 'Your phone verification code — Oikivo', tplPhoneOtp(user.firstName, user.phone!, code));
    return {
      message: 'Verification code sent to your email address.',
      ...(isDev && { devCode: code }),
    } as any;
  }

  // ─── Change Password ──────────────────────────────────────────────────────

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash) throw new BadRequestException('No password set — use social login.');
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersRepo.update(userId, { passwordHash, refreshToken: null as any });
    return { message: 'Password changed successfully' };
  }

  // ─── Set Password (Google / social users) ────────────────────────────────

  async setPassword(
    userId: number,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.passwordHash) throw new BadRequestException('Account already has a password. Use change-password instead.');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersRepo.update(userId, { passwordHash });
    return { message: 'Password set successfully' };
  }

  // ─── Email Change ─────────────────────────────────────────────────────────

  async requestEmailChange(
    userId: number,
    newEmail: string,
  ): Promise<{ message: string; devToken?: string }> {
    const existing = await this.usersRepo.findOne({ where: { email: newEmail } });
    if (existing) throw new ConflictException('That email is already in use');

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const secret = this.config.get<string>('JWT_SECRET', 'sakan-secret');
    const token = await this.jwtService.signAsync(
      { sub: userId, newEmail, type: 'email-change' },
      { secret, expiresIn: '24h' },
    );

    const frontendUrlRaw = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const frontendUrl = frontendUrlRaw.split(',')[0]?.trim() || 'http://localhost:3000';
    const confirmUrl = `${frontendUrl.replace(/\/$/, '')}/en/account?action=confirm-email&token=${encodeURIComponent(token)}`;

    await this.mail.send(newEmail, 'Confirm your new email — Oikivo', tplConfirmEmailChange(user.firstName, newEmail, confirmUrl));

    const isDev = this.config.get('NODE_ENV', 'development') === 'development';
    return {
      message: 'A verification link has been sent to your new email address.',
      ...(isDev && { devToken: token }),
    } as any;
  }

  async confirmEmailChange(token: string): Promise<{ message: string }> {
    const secret = this.config.get<string>('JWT_SECRET', 'sakan-secret');
    let payload: { sub: number; newEmail: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new BadRequestException('Invalid or expired link');
    }
    if (payload.type !== 'email-change') throw new BadRequestException('Invalid token');

    const conflict = await this.usersRepo.findOne({ where: { email: payload.newEmail } });
    if (conflict && conflict.id !== payload.sub) throw new ConflictException('Email already in use');

    await this.usersRepo.update(payload.sub, { email: payload.newEmail, isEmailVerified: true });
    return { message: 'Email updated successfully. Please log in again.' };
  }

  async verifyPhone(userId: number, code: string): Promise<{ message: string }> {
    const record = await this.verificationTokenRepo.findOne({
      where: { userId, token: code, type: 'phone', usedAt: null as any, expiresAt: MoreThan(new Date()) },
    });
    if (!record) throw new BadRequestException('Invalid or expired verification code');

    await this.usersRepo.update(userId, { isPhoneVerified: true });
    await this.verificationTokenRepo.update(record.id, { usedAt: new Date() });

    return { message: 'Phone number verified successfully' };
  }

  // ─── Reset Token Validation ───────────────────────────────────────────────

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const record = await this.passwordResetRepo.findOne({
      where: { token, usedAt: null as any, expiresAt: MoreThan(new Date()) },
    });
    return { valid: !!record };
  }

  // ─── Google Unlink ────────────────────────────────────────────────────────

  async unlinkGoogle(userId: number): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash', 'googleId'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.googleId) throw new BadRequestException('No Google account is linked to this profile');
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Please set a password before unlinking Google, otherwise you will lose access to your account.',
      );
    }
    await this.usersRepo.update(userId, { googleId: null });
    return { message: 'Google account unlinked successfully.' };
  }

  // ─── TOTP 2FA ─────────────────────────────────────────────────────────────

  async setupTotp(userId: number): Promise<{ secret: string; qrDataUrl: string }> {
    const QRCode = await import('qrcode');

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const secret = authenticator.generateSecret();
    await this.usersRepo.update(userId, { totpSecret: secret } as any);

    const otpauth = authenticator.keyuri(user.email, 'Oikivo', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    return { secret, qrDataUrl };
  }

  async enableTotp(userId: number, code: string): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'totpSecret', 'isTotpEnabled'],
    });
    if (!user || !user.totpSecret) throw new BadRequestException('Please set up 2FA first');
    if (user.isTotpEnabled) throw new BadRequestException('2FA is already enabled');

    const isValid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!isValid) throw new BadRequestException('Invalid verification code');

    await this.usersRepo.update(userId, { isTotpEnabled: true } as any);
    return { message: '2FA enabled successfully' };
  }

  async disableTotp(userId: number, code: string): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'totpSecret', 'isTotpEnabled'],
    });
    if (!user || !user.isTotpEnabled) throw new BadRequestException('2FA is not enabled');

    const isValid = authenticator.verify({ token: code, secret: user.totpSecret! });
    if (!isValid) throw new BadRequestException('Invalid verification code');

    await this.usersRepo.update(userId, { isTotpEnabled: false, totpSecret: null } as any);
    return { message: '2FA disabled successfully' };
  }

  // ─── Session Management ───────────────────────────────────────────────────

  async getMySessions(userId: number) {
    return this.sessionRepo.find({
      where: { userId, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async revokeSession(userId: number, sessionId: number): Promise<{ message: string }> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Session not found');
    await this.sessionRepo.delete(sessionId);
    return { message: 'Session revoked' };
  }

  async revokeAllSessions(userId: number): Promise<{ message: string }> {
    await this.sessionRepo.delete({ userId });
    return { message: 'All sessions revoked' };
  }
}

