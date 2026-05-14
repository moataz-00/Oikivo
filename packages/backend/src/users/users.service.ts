import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { existsSync, rmSync, unlinkSync } from 'fs';
import { join } from 'path';
import { UserEntity } from '../entities/user.entity';
import { ReviewEntity } from '../entities/review.entity';
import { BookingEntity } from '../entities/booking.entity';
import { PropertyEntity } from '../entities/property.entity';
import { PropertyPhotoEntity } from '../entities/property-photo.entity';
import { ExperienceEntity } from '../entities/experience.entity';
import { ExperiencePhotoEntity } from '../entities/experience-photo.entity';
import { MessageEntity } from '../entities/message.entity';
import { BlockedUserEntity } from '../entities/blocked-user.entity';
import { VerificationTokenEntity } from '../entities/verification-token.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PHONE_REGEX } from './dto/update-profile.dto';
import { tplHostActivationRequest, MailService, tplAdminIdDocumentPending } from '../mail/mail.service';

const ADMIN_NOTIFY_EMAIL = 'oikivo.support@gmail.com';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    @InjectRepository(ReviewEntity)
    private reviewsRepo: Repository<ReviewEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(PropertyPhotoEntity)
    private propertyPhotosRepo: Repository<PropertyPhotoEntity>,
    @InjectRepository(ExperienceEntity)
    private experiencesRepo: Repository<ExperienceEntity>,
    @InjectRepository(ExperiencePhotoEntity)
    private experiencePhotosRepo: Repository<ExperiencePhotoEntity>,
    @InjectRepository(MessageEntity)
    private messagesRepo: Repository<MessageEntity>,
    @InjectRepository(BlockedUserEntity)
    private blockedUsersRepo: Repository<BlockedUserEntity>,
    @InjectRepository(VerificationTokenEntity)
    private verificationTokenRepo: Repository<VerificationTokenEntity>,
    private jwtService: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  private sanitizeUser(user: UserEntity) {
    const { passwordHash, refreshToken, ...rest } = user as any;
    return rest;
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await this.usersRepo.findOne({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** G7: Get notification preferences for a user */
  async getNotificationPreferences(userId: number): Promise<Record<string, boolean>> {
    const user = await this.findById(userId);
    return (user as any).notificationPreferences ?? {};
  }

  /** G7: Update notification preferences for a user */
  async updateNotificationPreferences(
    userId: number,
    prefs: Record<string, boolean>,
  ): Promise<Record<string, boolean>> {
    await this.usersRepo.update(userId, { notificationPreferences: prefs } as any);
    return this.getNotificationPreferences(userId);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserEntity> {
    const user = await this.findById(userId);
    // If phone changed, require re-verification and clear old OTP tokens
    // so the user can request a new code immediately without hitting the cooldown
    if (dto.phone && dto.phone !== user.phone) {
      (user as any).isPhoneVerified = false;
      await this.verificationTokenRepo.delete({ userId, type: 'phone' });
    }
    // FIX U1: Explicitly pick allowed fields instead of Object.assign to prevent privilege escalation
    const allowedFields: (keyof UpdateProfileDto)[] = [
      'firstName', 'lastName', 'phone', 'bio', 'dateOfBirth', 'preferredLanguage', 'avatarUrl',
    ];
    for (const field of allowedFields) {
      if (dto[field] !== undefined) {
        (user as any)[field] = dto[field];
      }
    }
    (user as any).lastProfileEditAt = new Date();
    return this.usersRepo.save(user);
  }

  async makeHost(userId: number): Promise<UserEntity> {
    const user = await this.findById(userId);

    if (!user.phone || !PHONE_REGEX.test(user.phone)) {
      throw new BadRequestException(
        'A verified phone number is required to become a host. Please add your phone number in your profile first.',
      );
    }
    if (!user.isPhoneVerified) {
      throw new BadRequestException(
        'Your phone number must be verified before you can start hosting.',
      );
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException(
        'Please verify your email address before becoming a host.',
      );
    }

    user.isHost = true;
    return this.usersRepo.save(user);
  }

  async requestHostActivation(userId: number, locale: 'en' | 'ar' = 'en') {
    const user = await this.findById(userId);

    if (user.isHost) {
      return { message: 'Your hosting account is already active.' };
    }

    if (!user.phone || !PHONE_REGEX.test(user.phone)) {
      throw new BadRequestException(
        'A verified phone number is required to host on Oikivo. Please add your phone number in your profile settings.',
      );
    }
    if (!user.isPhoneVerified) {
      throw new BadRequestException(
        'Your phone number must be verified before you can activate hosting.',
      );
    }

    const secret = this.config.get<string>('HOST_ACTIVATION_SECRET')
      ?? this.config.get<string>('JWT_SECRET')
      ?? 'sakan-secret';
    const expiresIn = this.config.get<string>('HOST_ACTIVATION_EXPIRES_IN') ?? '24h';
    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        type: 'host-activation',
      },
      { secret, expiresIn },
    );

    const frontendUrlRaw = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const frontendUrl = frontendUrlRaw.split(',')[0]?.trim() || 'http://localhost:3000';
    const activationUrl = `${frontendUrl.replace(/\/$/, '')}/${locale}/hosting/activate?token=${encodeURIComponent(token)}`;

    await this.sendHostActivationEmail(user, activationUrl, locale);

    return {
      message: 'Activation email sent. Please check your inbox.',
    };
  }

  async confirmHostActivation(token: string) {
    const secret = this.config.get<string>('HOST_ACTIVATION_SECRET')
      ?? this.config.get<string>('JWT_SECRET')
      ?? 'sakan-secret';

    let payload: { sub: number; email: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new BadRequestException('Invalid or expired activation link');
    }

    if (payload.type !== 'host-activation') {
      throw new BadRequestException('Invalid activation token');
    }

    const user = await this.findById(payload.sub);
    if (user.email !== payload.email) {
      throw new BadRequestException('Invalid activation token');
    }

    if (!user.isHost) {
      user.isHost = true;
      await this.usersRepo.save(user);
    }

    return {
      message: 'Hosting account activated successfully.',
      user: this.sanitizeUser(user),
    };
  }

  private async sendHostActivationEmail(
    user: UserEntity,
    activationUrl: string,
    locale: 'en' | 'ar',
  ) {
    const smtpUser = this.config.get<string>('SMTP_USER') ?? this.config.get<string>('EMAIL_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS') ?? this.config.get<string>('EMAIL_PASS');
    const smtpHost = this.config.get<string>('SMTP_HOST') ?? (smtpUser ? 'smtp.gmail.com' : undefined);
    const smtpPort = Number(this.config.get<string>('SMTP_PORT', '587'));
    const from = this.config.get<string>('SMTP_FROM', `Oikivo <${smtpUser || 'no-reply@oikivo.com'}>`);

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new BadRequestException(
        'Email service is not configured. Please set SMTP_HOST/SMTP_USER/SMTP_PASS (or EMAIL_USER/EMAIL_PASS).',
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const isArabic = locale === 'ar';
    const subject = isArabic ? 'تفعيل الاستضافة في Oikivo' : 'Activate your Oikivo hosting account';

    const html = tplHostActivationRequest(user.firstName, isArabic, activationUrl);

    try {
      await transporter.sendMail({
        from,
        to: user.email,
        subject,
        html,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown SMTP error';
      throw new BadRequestException(`Failed to send activation email. ${reason}`);
    }
  }

  async getPublicProfile(id: number) {
    const user = await this.usersRepo.findOne({
      where: { id, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const reviewStats = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.overallRating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .innerJoin('review.property', 'property', 'property.hostId = :userId', { userId: id })
      .getRawOne();

    return {
      id: user.id,
      profileUuid: user.profileUuid,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isHost: user.isHost,
      isSuperhost: user.isSuperhost,
      isEmailVerified: user.isEmailVerified,
      isIdentityVerified: user.isIdVerified,
      createdAt: user.createdAt,
      joinedAt: user.createdAt,
      avgRating: parseFloat(reviewStats?.avgRating) || null,
      reviewCount: parseInt(reviewStats?.totalReviews) || 0,
    };
  }

  async getPublicProfileByUuid(profileUuid: string) {
    const user = await this.usersRepo.findOne({
      where: { profileUuid, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const reviewStats = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.overallRating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .innerJoin('review.property', 'property', 'property.hostId = :userId', { userId: user.id })
      .getRawOne();

    return {
      id: user.id,
      profileUuid: user.profileUuid,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isHost: user.isHost,
      isSuperhost: user.isSuperhost,
      isEmailVerified: user.isEmailVerified,
      isIdentityVerified: user.isIdVerified,
      createdAt: user.createdAt,
      joinedAt: user.createdAt,
      avgRating: parseFloat(reviewStats?.avgRating) || null,
      reviewCount: parseInt(reviewStats?.totalReviews) || 0,
    };
  }

  async getUserReviews(userId: number, page = 1, limit = 20) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;
    const [reviews, total] = await this.reviewsRepo
      .createQueryBuilder('review')
      .innerJoin('review.property', 'property', 'property.hostId = :userId', { userId })
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.property', 'reviewProperty')
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { data: reviews, total, page, totalPages: Math.ceil(total / take) };
  }

  async getUserStats(userId: number) {
    const user = await this.findById(userId);

    const totalStays = await this.bookingsRepo.count({
      where: { guestId: userId, status: 'completed' },
    });

    const reviewStats = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.overallRating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .innerJoin('review.property', 'property', 'property.hostId = :userId', { userId })
      .getRawOne();

    return {
      totalStays,
      avgRatingAsHost: parseFloat(reviewStats.avgRating) || 0,
      totalReviewsAsHost: parseInt(reviewStats.totalReviews) || 0,
      isSuperhost: user.isSuperhost,
      memberSince: user.createdAt,
    };
  }

  async updateAvatar(userId: number, avatarUrl: string): Promise<UserEntity> {
    // Delete old avatar file if it was a local upload
    const current = await this.usersRepo.findOne({ where: { id: userId }, select: ['id', 'avatarUrl'] as any });
    if (current?.avatarUrl && current.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldPath = join(process.cwd(), current.avatarUrl.replace(/^\//, ''));
      try {
        if (existsSync(oldPath)) unlinkSync(oldPath);
      } catch { /* best-effort */ }
    }
    await this.usersRepo.update(userId, { avatarUrl });
    return this.findById(userId);
  }

  /** Returns active users who can be invited as co-host or cleaner.
   *  Returns a safe public subset (no email/phone/tokens). */
  async getAvailableCohosts(
    search?: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: Partial<UserEntity>[]; total: number }> {
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .select([
        'u.id', 'u.profileUuid', 'u.firstName', 'u.lastName',
        'u.email', 'u.avatarUrl', 'u.bio', 'u.isSuperhost', 'u.isHost',
        'u.idVerificationStatus', 'u.createdAt',
      ])
      .where('u.isActive = true AND u.isHost = true')
      .orderBy('u.isSuperhost', 'DESC')
      .addOrderBy('u.createdAt', 'DESC');

    if (search?.trim()) {
      qb.andWhere(
        '(LOWER(u.firstName) LIKE :q OR LOWER(u.lastName) LIKE :q OR LOWER(CONCAT(u.firstName, \' \', u.lastName)) LIKE :q)',
        { q: `%${search.toLowerCase().trim()}%` },
      );
    }

    const [raw, total] = await qb.skip(offset).take(limit).getManyAndCount();
    const items = raw.map(({ passwordHash, refreshToken, ...safe }: any) => safe);
    return { items, total };
  }

  async getHostPublicListings(hostId: number) {
    const props = await this.propertiesRepo.find({
      where: { hostId, status: 'published' as any, isActive: true },
      relations: ['photos'],
      order: { createdAt: 'DESC' },
      take: 6,
    });
    return props.map((p) => ({
      id: p.id,
      uuid: p.uuid,
      title: p.title,
      city: p.city,
      country: p.country,
      pricePerNight: p.pricePerNight,
      coverPhoto: (p as any).photos?.[0]?.url ?? null,
      avgRating: (p as any).avgRating ?? null,
      reviewCount: (p as any).reviewCount ?? 0,
    }));
  }

  async submitIdDocument(userId: number, docUrl: string, docType: 'national_id' | 'passport' = 'national_id') {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    await this.usersRepo.update(userId, {
      idDocumentUrl: docUrl,
      idDocumentType: docType,
      // For passport: immediately set pending (no back needed).
      // For national ID: set pending now; back upload is separate.
      idVerificationStatus: 'pending',
      isIdVerified: false,
    } as any);

    // Notify admin of new ID verification request
    const adminPanelUrl = (process.env.ADMIN_URL ?? 'http://localhost:3003') + '/host-verification';
    const hostName = user ? `${user.firstName} ${user.lastName}` : `User #${userId}`;
    const hostEmail = user?.email ?? '';
    this.mail.send(
      ADMIN_NOTIFY_EMAIL,
      'New ID Verification Request',
      tplAdminIdDocumentPending(hostName, hostEmail, adminPanelUrl),
    ).catch(() => {});

    return { message: 'ID document submitted for review. Verification typically takes 1–2 business days.' };
  }

  async submitIdDocumentBack(userId: number, docUrl: string) {
    await this.usersRepo.update(userId, {
      idDocumentBackUrl: docUrl,
    } as any);
    return { message: 'ID document back side uploaded. Your full document is now under review.' };
  }

  async deleteAccount(userId: number): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isAdmin) throw new ForbiddenException('Admin accounts cannot be deleted');

    const mgr = this.bookingsRepo.manager;

    // Blocker 1: active bookings as guest
    const guestBookingCount: number = await this.bookingsRepo.count({
      where: [
        { guestId: userId, status: 'pending' as any },
        { guestId: userId, status: 'confirmed' as any },
        { guestId: userId, status: 'in_progress' as any },
      ],
    });
    if (guestBookingCount > 0) {
      throw new BadRequestException(
        `You have ${guestBookingCount} active booking${guestBookingCount > 1 ? 's' : ''} as a guest. Please cancel or wait for them to complete before deleting your account.`,
      );
    }

    // Blocker 2: active bookings as host
    const hostBookingCount: number = await this.bookingsRepo.count({
      where: [
        { hostId: userId, status: 'pending' as any },
        { hostId: userId, status: 'confirmed' as any },
        { hostId: userId, status: 'in_progress' as any },
      ],
    });
    if (hostBookingCount > 0) {
      throw new BadRequestException(
        `You have ${hostBookingCount} active booking${hostBookingCount > 1 ? 's' : ''} as a host. Please complete or cancel them before deleting your account.`,
      );
    }

    // Blocker 3: open disputes
    const [disputeRows] = await mgr.query<[{ cnt: string }]>(
      `SELECT COUNT(*) AS cnt FROM disputes WHERE raised_by_id = ? AND status IN ('open','under_review')`,
      [userId],
    );
    const disputeCount = parseInt(disputeRows.cnt, 10);
    if (disputeCount > 0) {
      throw new BadRequestException(
        `You have ${disputeCount} open dispute${disputeCount > 1 ? 's' : ''}. Please wait for them to be resolved before deleting your account.`,
      );
    }

    // Blocker 4: pending payouts
    const [payoutRows] = await mgr.query<[{ cnt: string }]>(
      `SELECT COUNT(*) AS cnt FROM payouts WHERE host_id = ? AND status IN ('pending','processing')`,
      [userId],
    );
    const payoutCount = parseInt(payoutRows.cnt, 10);
    if (payoutCount > 0) {
      throw new BadRequestException(
        `You have ${payoutCount} pending payout${payoutCount > 1 ? 's' : ''}. Please wait for them to be processed before deleting your account.`,
      );
    }

    const uploadsRoot = join(process.cwd(), 'uploads');
    const filesToDelete: string[] = [];

    // Avatar
    if (user.avatarUrl) {
      // stored as /uploads/avatars/filename → strip leading slash
      filesToDelete.push(join(uploadsRoot, user.avatarUrl.replace(/^\/uploads\//, '')));
    }

    // ID document
    if ((user as any).idDocumentUrl) {
      filesToDelete.push(join(uploadsRoot, (user as any).idDocumentUrl.replace(/^\/uploads\//, '')));
    }

    // Message images sent by this user
    const imageMessages = await this.messagesRepo.find({
      where: { senderId: userId, messageType: 'image' },
    });
    for (const msg of imageMessages) {
      if (msg.imageUrl) {
        filesToDelete.push(join(uploadsRoot, msg.imageUrl.replace(/^\/uploads\//, '')));
      }
    }

    // Property photo directories (whole folder per property)
    const properties = await this.propertiesRepo.find({ where: { hostId: userId } });
    const propertyDirsToDelete = properties.map((p) =>
      join(uploadsRoot, 'properties', String(p.id)),
    );

    // Experience photo directories
    const experiences = await this.experiencesRepo.find({ where: { hostId: userId } });
    const experienceDirsToDelete = experiences.map((e) =>
      join(uploadsRoot, 'experiences', String(e.id)),
    );

    // Soft-delete the user: anonymize PII and mark inactive.
    // Hard-deleting fails because bookings.guest_id / host_id FK constraints
    // have no ON DELETE CASCADE — and we must preserve financial audit history anyway.
    const anonymousEmail = `deleted-${user.profileUuid}@deleted.invalid`;
    await this.usersRepo.update(userId, {
      email: anonymousEmail,
      passwordHash: null,
      firstName: 'Deleted',
      lastName: 'User',
      phone: null,
      bio: null,
      dateOfBirth: null,
      avatarUrl: null,
      idDocumentUrl: null,
      idDocumentBackUrl: null,
      googleId: null,
      fcmToken: null,
      totpSecret: null,
      isTotpEnabled: false,
      isActive: false,
      isHost: false,
      isSuperhost: false,
      isConsultant: false,
      isIdVerified: false,
      idVerificationStatus: 'none' as any,
      idRejectionReason: null,
      autoReplyEnabled: false,
      autoReplyMessage: null,
      notificationPreferences: null,
      autoPayoutAccountDetails: null,
      deletedAt: new Date(),
    } as any);

    // Revoke refresh token so existing sessions are invalidated immediately
    await mgr.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [userId]);

    // Delete files after DB delete so a failed unlink can't block account removal
    for (const filePath of filesToDelete) {
      try {
        if (existsSync(filePath)) rmSync(filePath, { force: true });
      } catch { /* best-effort */ }
    }
    for (const dir of [...propertyDirsToDelete, ...experienceDirsToDelete]) {
      try {
        if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
      } catch { /* best-effort */ }
    }
  }

  async exportUserData(userId: number): Promise<object> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [bookingsAsGuest, reviewsWritten, messagesSent] = await Promise.all([
      this.bookingsRepo.find({ where: { guestId: userId }, take: 200 }),
      this.reviewsRepo.find({ where: { reviewerId: userId }, take: 200 }),
      this.messagesRepo.find({ where: { senderId: userId }, take: 200 }),
    ]);

    const { passwordHash, refreshToken, totpSecret, ...safeUser } = user as any;

    return {
      exportedAt: new Date().toISOString(),
      profile: safeUser,
      bookingsAsGuest,
      reviewsWritten,
      messagesSent,
    };
  }

  // MSG-G3: Block a user
  async blockUser(blockerId: number, blockedUserId: number): Promise<{ message: string }> {
    if (blockerId === blockedUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    // Check if blocked user exists
    const blockedUser = await this.usersRepo.findOne({ where: { id: blockedUserId } });
    if (!blockedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const existing = await this.blockedUsersRepo.findOne({
      where: { blockerId, blockedUserId },
    });

    if (existing) {
      throw new BadRequestException('User is already blocked');
    }

    // Create block record
    const block = this.blockedUsersRepo.create({
      blockerId,
      blockedUserId,
    });

    await this.blockedUsersRepo.save(block);

    return { message: 'User blocked successfully' };
  }

  // MSG-G3: Unblock a user
  async unblockUser(blockerId: number, blockedUserId: number): Promise<{ message: string }> {
    const block = await this.blockedUsersRepo.findOne({
      where: { blockerId, blockedUserId },
    });

    if (!block) {
      throw new NotFoundException('Block record not found');
    }

    await this.blockedUsersRepo.remove(block);

    return { message: 'User unblocked successfully' };
  }

  // MSG-G3: Get list of blocked users
  async getBlockedUsers(userId: number): Promise<UserEntity[]> {
    const blocks = await this.blockedUsersRepo.find({
      where: { blockerId: userId },
      relations: ['blockedUser'],
    });

    return blocks.map((b) => this.sanitizeUser(b.blockedUser) as UserEntity);
  }

  // MSG-G3: Check if user is blocked
  async isUserBlocked(blockerId: number, blockedUserId: number): Promise<boolean> {
    const block = await this.blockedUsersRepo.findOne({
      where: { blockerId, blockedUserId },
    });

    return !!block;
  }
}
