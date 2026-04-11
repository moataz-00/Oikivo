import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { existsSync, rmSync } from 'fs';
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EGYPTIAN_PHONE_REGEX } from './dto/update-profile.dto';

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
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private sanitizeUser(user: UserEntity) {
    const { passwordHash, refreshToken, ...rest } = user as any;
    return rest;
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['properties'],
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
    // If phone changed, require re-verification
    if (dto.phone && dto.phone !== user.phone) {
      (user as any).isPhoneVerified = false;
    }
    Object.assign(user, dto);
    (user as any).lastProfileEditAt = new Date();
    return this.usersRepo.save(user);
  }

  async makeHost(userId: number): Promise<UserEntity> {
    const user = await this.findById(userId);

    if (!user.phone || !EGYPTIAN_PHONE_REGEX.test(user.phone)) {
      throw new BadRequestException(
        'A verified Egyptian mobile number is required to become a host. Please add your Egyptian number (+2010x / 010x) in your profile first.',
      );
    }
    if (!user.isPhoneVerified) {
      throw new BadRequestException(
        'Your Egyptian mobile number must be verified before you can start hosting.',
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

    if (!user.phone || !EGYPTIAN_PHONE_REGEX.test(user.phone)) {
      throw new BadRequestException(
        'A verified Egyptian mobile number is required to host on Journey Stay. Please add your Egyptian number (+2010x / 010x) in your profile settings.',
      );
    }
    if (!user.isPhoneVerified) {
      throw new BadRequestException(
        'Your Egyptian mobile number must be verified before you can activate hosting.',
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
    const subject = isArabic ? 'تفعيل الاستضافة في Journey Stay' : 'Activate your Journey Stay hosting account';
    const heading = isArabic ? `مرحباً ${user.firstName}،` : `Hi ${user.firstName},`;
    const body = isArabic
      ? 'اضغط على الزر أدناه لتفعيل حساب الاستضافة والبدء بإنشاء إعلانك.'
      : 'Click the button below to activate hosting and start creating your listing.';
    const cta = isArabic ? 'تفعيل الاستضافة' : 'Activate Hosting';
    const footer = isArabic
      ? 'إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة.'
      : 'If you did not request this, you can safely ignore this email.';

    const html = `
      <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;color:#111827;">
        <table role="presentation" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:24px;background:linear-gradient(135deg,#0f766e,#0ea5e9);color:#fff;">
              <h1 style="margin:0;font-size:24px;">Journey Stay</h1>
              <p style="margin:8px 0 0;font-size:14px;opacity:.95;">${isArabic ? 'تفعيل حساب المضيف' : 'Host Account Activation'}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:16px;">${heading}</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">${body}</p>
              <a href="${activationUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">${cta}</a>
              <p style="margin:20px 0 0;font-size:13px;color:#6b7280;word-break:break-all;">${activationUrl}</p>
              <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">${footer}</p>
            </td>
          </tr>
        </table>
      </div>
    `;

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

  async getUserReviews(userId: number) {
    // Reviews about user's properties (host reviews)
    const reviews = await this.reviewsRepo
      .createQueryBuilder('review')
      .innerJoin('review.property', 'property', 'property.hostId = :userId', { userId })
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.property', 'reviewProperty')
      .orderBy('review.createdAt', 'DESC')
      .getMany();

    return reviews;
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

  async submitIdDocument(userId: number, docUrl: string) {
    await this.usersRepo.update(userId, {
      idDocumentUrl: docUrl,
      idVerificationStatus: 'pending',
      isIdVerified: false,
    } as any);
    return { message: 'ID document submitted for review. Verification typically takes 1–2 business days.' };
  }

  async deleteAccount(userId: number): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isAdmin) throw new ForbiddenException('Admin accounts cannot be deleted');

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

    // Delete the user — DB CASCADE removes all related rows automatically
    await this.usersRepo.delete(userId);

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
