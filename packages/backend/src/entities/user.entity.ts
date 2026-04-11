import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PropertyEntity } from './property.entity';
import { BookingEntity } from './booking.entity';
import { ReviewEntity } from './review.entity';
import { WishlistEntity } from './wishlist.entity';
import { NotificationEntity } from './notification.entity';
import { ConversationEntity } from './conversation.entity';
import { MessageEntity } from './message.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'profile_uuid', length: 36, unique: true, nullable: true })
  profileUuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.profileUuid) this.profileUuid = uuidv4();
  }

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string;

  @Column({ name: 'is_host', default: false })
  isHost: boolean;

  @Column({ name: 'is_superhost', default: false })
  isSuperhost: boolean;

  @Column({ name: 'is_consultant', default: false })
  isConsultant: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'is_id_verified', default: false })
  isIdVerified: boolean;

  @Column({ name: 'id_document_url', length: 500, nullable: true })
  idDocumentUrl: string | null;

  @Column({
    name: 'id_verification_status',
    type: 'enum',
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  })
  idVerificationStatus: 'none' | 'pending' | 'approved' | 'rejected';

  @Column({ name: 'is_admin', default: false })
  isAdmin: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    name: 'preferred_language',
    type: 'enum',
    enum: ['en', 'ar'],
    default: 'en',
  })
  preferredLanguage: string;

  @Column({ name: 'google_id', length: 255, nullable: true })
  googleId: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true, select: false })
  refreshToken: string;

  @Column({ name: 'totp_secret', length: 255, nullable: true, select: false })
  totpSecret: string | null;

  @Column({ name: 'is_totp_enabled', default: false })
  isTotpEnabled: boolean;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'last_booking_at', type: 'datetime', nullable: true })
  lastBookingAt: Date | null;

  @Column({ name: 'last_profile_edit_at', type: 'datetime', nullable: true })
  lastProfileEditAt: Date | null;

  @Column({ name: 'host_cancelled_bookings_count', type: 'int', unsigned: true, default: 0 })
  hostCancelledBookingsCount: number;

  @Column({ name: 'last_host_cancellation_at', type: 'datetime', nullable: true })
  lastHostCancellationAt: Date | null;

  @Column({ name: 'auto_payout_enabled', default: false })
  autoPayoutEnabled: boolean;

  @Column({
    name: 'auto_payout_frequency',
    type: 'enum',
    enum: ['weekly', 'monthly'],
    default: 'weekly',
  })
  autoPayoutFrequency: 'weekly' | 'monthly';

  @Column({ name: 'auto_payout_day', type: 'tinyint', unsigned: true, nullable: true })
  autoPayoutDay: number | null;

  @Column({ name: 'auto_payout_min_balance', type: 'decimal', precision: 10, scale: 2, default: 100 })
  autoPayoutMinBalance: number;

  @Column({
    name: 'auto_payout_method',
    type: 'enum',
    enum: ['instapay', 'bank_transfer', 'cash'],
    default: 'instapay',
  })
  autoPayoutMethod: 'instapay' | 'bank_transfer' | 'cash';

  @Column({ name: 'auto_payout_account_details', type: 'text', nullable: true })
  autoPayoutAccountDetails: string | null;

  /**
   * G7: Per-user email/notification channel preferences.
   * All channels default to enabled (true). Guests can opt-out individually.
   */
  @Column({
    name: 'notification_preferences',
    type: 'json',
    nullable: true,
  })
  notificationPreferences: {
    bookingConfirmed?: boolean;
    bookingCancelled?: boolean;
    bookingRequest?: boolean;
    paymentConfirmed?: boolean;
    refundProcessed?: boolean;
    newMessage?: boolean;
    newReview?: boolean;
    promotionsAndUpdates?: boolean;
  } | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PropertyEntity, (p) => p.host)
  properties: PropertyEntity[];

  @OneToMany(() => BookingEntity, (b) => b.guest)
  bookings: BookingEntity[];

  @OneToMany(() => ReviewEntity, (r) => r.reviewer)
  reviews: ReviewEntity[];

  @OneToMany(() => WishlistEntity, (w) => w.user)
  wishlists: WishlistEntity[];

  @OneToMany(() => NotificationEntity, (n) => n.user)
  notifications: NotificationEntity[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
