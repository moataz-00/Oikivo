import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { PropertyEntity } from '../entities/property.entity';
import { CategoryEntity } from '../entities/category.entity';
import { AmenityEntity } from '../entities/amenity.entity';
import { ConsultantEntity } from '../entities/consultant.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { BookingEntity } from '../entities/booking.entity';
import { ReviewEntity } from '../entities/review.entity';
import { PayoutEntity } from '../entities/payout.entity';
import { EarningEntity } from '../entities/earning.entity';
import { ExperienceBookingEntity } from '../entities/experience-booking.entity';
import { PlatformSettingEntity } from '../entities/platform-setting.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { ConversationEntity } from '../entities/conversation.entity';
import { MessageEntity } from '../entities/message.entity';
import { AdminActivityLogEntity } from '../entities/admin-activity-log.entity';
import { ExpenseEntity } from '../entities/expense.entity';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplPayoutProcessed } from '../mail/mail.service';
import * as MailTpl from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

const EMAIL_TEMPLATE_REGISTRY: Array<{
  slug: string;
  name: string;
  category: string;
  description: string;
  render: () => string;
}> = [
  // Auth
  { slug: 'email-verification', name: 'Email Verification', category: 'Auth', description: 'Sent to verify a new user email address',
    render: () => MailTpl.tplEmailVerification('Ahmed', 'https://sakan.app/verify?token=sample') },
  { slug: 'password-reset', name: 'Password Reset', category: 'Auth', description: 'Sent when a user requests a password reset',
    render: () => MailTpl.tplPasswordReset('Ahmed', 'https://sakan.app/reset?token=sample') },
  { slug: 'welcome', name: 'Welcome', category: 'Auth', description: 'Sent to new users after registration',
    render: () => MailTpl.tplWelcome('Ahmed', 'https://sakan.app/login') },
  { slug: 'phone-otp', name: 'Phone OTP', category: 'Auth', description: 'Sent for phone number verification',
    render: () => MailTpl.tplPhoneOtp('Ahmed', '+201234567890', '123456') },
  { slug: 'confirm-email-change', name: 'Confirm Email Change', category: 'Auth', description: 'Sent to confirm an email address change',
    render: () => MailTpl.tplConfirmEmailChange('Ahmed', 'new@example.com', 'https://sakan.app/confirm-email?token=sample') },

  // Bookings
  { slug: 'booking-confirmed', name: 'Booking Confirmed (Guest)', category: 'Bookings', description: 'Sent to guest when a booking is confirmed',
    render: () => MailTpl.tplBookingConfirmed('Ahmed', 'Nile View Apartment', 'Jan 15', 'Jan 18', 3, 'EGP 4,500', 'EGP', 'BK-20250115-001', 'https://sakan.app/bookings/1') },
  { slug: 'booking-request-received', name: 'Booking Request (Host)', category: 'Bookings', description: 'Sent to host when a new booking request arrives',
    render: () => MailTpl.tplBookingRequestReceived('Mohamed', 'Ahmed', 'Nile View Apartment', 'Jan 15', 'Jan 18', 3, 'EGP 4,500', 'EGP', 'https://sakan.app/hosting/bookings/1') },
  { slug: 'booking-cancelled', name: 'Booking Cancelled', category: 'Bookings', description: 'Sent when a booking is cancelled',
    render: () => MailTpl.tplBookingCancelled('Ahmed', 'guest', 'Nile View Apartment', 'Jan 15', 'Jan 18', 'BK-001', 'EGP 4,500', 'EGP') },
  { slug: 'booking-request-submitted', name: 'Booking Request Submitted (Guest)', category: 'Bookings', description: 'Confirmation that a booking request was submitted',
    render: () => MailTpl.tplBookingRequestSubmitted('Ahmed', 'Nile View Apartment', 'Jan 15', 'Jan 18', 3, 'EGP 4,500', 'EGP', 'BK-001', 'moderate', 'https://sakan.app/bookings/1') },

  // Payments
  { slug: 'payment-invoice', name: 'Payment Invoice', category: 'Payments', description: 'Full payment invoice sent to the guest',
    render: () => MailTpl.tplPaymentInvoice('Ahmed', 'INV-20250115-001', 'Jan 15, 2025', 'Nile View Apartment', 'Jan 15', 'Jan 18', 3, 'EGP 1,200', 'EGP 200', 'EGP 504', 'EGP 4,304', 'EGP', 'instapay', 'IP-REF-001', 'https://sakan.app/bookings/1') },
  { slug: 'instapay-payment-confirmed', name: 'InstaPay Payment Confirmed', category: 'Payments', description: 'Sent when InstaPay payment is verified',
    render: () => MailTpl.tplInstapayPaymentConfirmed('Ahmed', 'BK-001', 'Nile View Apartment', 'Jan 15', 'Jan 18', 'EGP 4,304', 'EGP', 'https://sakan.app/bookings/1') },
  { slug: 'instapay-payment-declined', name: 'InstaPay Payment Declined', category: 'Payments', description: 'Sent when InstaPay payment proof is rejected',
    render: () => MailTpl.tplInstapayPaymentDeclined('Ahmed', 'BK-001', 'Nile View Apartment', 'Image is unclear', 'https://sakan.app/bookings/1') },

  // Payouts
  { slug: 'payout-notification', name: 'Payout Notification', category: 'Payouts', description: 'Notifies host of an upcoming payout',
    render: () => MailTpl.tplPayoutNotification('Mohamed', 'EGP 3,492', 'EGP', 'Nile View Apartment', 'Jan 15', 'Jan 18', 'Jan 20', 'PAY-001', 'https://sakan.app/hosting/payouts') },
  { slug: 'payout-processed', name: 'Payout Processed', category: 'Payouts', description: 'Confirms payout has been processed',
    render: () => MailTpl.tplPayoutProcessed('Mohamed', 'EGP 3,492', 'EGP', 'bank_transfer', '****1234', 'PAY-20250118-001', 'Jan 20, 2025', 'https://sakan.app/hosting/payouts') },
  { slug: 'refund-notification', name: 'Refund Notification', category: 'Payouts', description: 'Sent to guest about a refund',
    render: () => MailTpl.tplRefundNotification('Ahmed', 'EGP 4,304', 'EGP', 'Nile View Apartment', 'BK-001', 'Jan 20, 2025', 'instapay', 'https://sakan.app/bookings/1') },
  { slug: 'instapay-refund-completed', name: 'InstaPay Refund Completed', category: 'Payouts', description: 'Confirms an InstaPay refund was sent',
    render: () => MailTpl.tplInstapayRefundCompleted('Ahmed', 'Nile View Apartment', 'EGP 4,304', 'EGP', 'REF-001', 'https://sakan.app/bookings') },
  { slug: 'instapay-refund-pending', name: 'InstaPay Refund Pending', category: 'Payouts', description: 'Notifies guest that a refund is being processed',
    render: () => MailTpl.tplInstapayRefundPending('Ahmed', 'Nile View Apartment', 'EGP 4,304', 'EGP', 'BK-001', 'https://sakan.app/bookings/1') },

  // Messaging
  { slug: 'new-message', name: 'New Message', category: 'Messaging', description: 'Notification of a new message in a conversation',
    render: () => MailTpl.tplNewMessage('Ahmed', 'Mohamed', 'Hi, is the apartment available?', 'https://sakan.app/inbox/1') },

  // Host
  { slug: 'host-activation', name: 'Host Activation', category: 'Host', description: 'Congratulates host on account activation',
    render: () => MailTpl.tplHostActivation('Mohamed', 'https://sakan.app/hosting') },
  { slug: 'host-cancelled-rebooking', name: 'Host Cancelled – Rebook', category: 'Host', description: 'Encourages guest to rebook after host cancellation',
    render: () => MailTpl.tplHostCancelledRebooking('Ahmed', 'Nile View Apartment', 'Jan 15', 'Jan 18', 'EGP 4,304', 'https://sakan.app/search') },

  // Co-host
  { slug: 'cohost-invite', name: 'Co-host / Cleaner Invite', category: 'Host', description: 'Invitation to join as a co-host or cleaner',
    render: () => MailTpl.tplCohostInvite('Sara', 'Mohamed', 'Nile View Apartment', 'co_host', 'https://sakan.app/accept-invite?token=sample') },

  // Consultations
  { slug: 'consultation-request-received', name: 'Consultation Request (Consultant)', category: 'Consultations', description: 'Notifies consultant of a new request',
    render: () => MailTpl.tplConsultationRequestReceived('Dr. Youssef', 'Ahmed', 'Video Call', 'Jan 20, 2025 10:00 AM', 30, 'EGP 250', 'EGP', 'https://sakan.app/consultant/bookings/1') },
  { slug: 'consultation-request-submitted', name: 'Consultation Request Submitted (Client)', category: 'Consultations', description: 'Confirms the consultation request to the client',
    render: () => MailTpl.tplConsultationRequestSubmitted('Ahmed', 'Dr. Youssef', 'Video Call', 'Jan 20, 2025 10:00 AM', 30, 'EGP 250', 'EGP', 'https://sakan.app/consultations/1') },
  { slug: 'consultation-confirmed', name: 'Consultation Confirmed', category: 'Consultations', description: 'Confirms a consultation appointment',
    render: () => MailTpl.tplConsultationConfirmed('Ahmed', 'Dr. Youssef', 'Video Call', 'Jan 20, 2025 10:00 AM', 30, 'EGP 250', 'EGP', 'https://meet.google.com/abc', 'https://sakan.app/consultations/1') },
  { slug: 'consultation-declined', name: 'Consultation Declined', category: 'Consultations', description: 'Notifies client of a declined request',
    render: () => MailTpl.tplConsultationDeclined('Ahmed', 'Dr. Youssef', 'Video Call', 'Jan 20, 2025 10:00 AM', 'Schedule conflict', 'https://sakan.app/consultations') },
  { slug: 'consultation-reminder', name: 'Consultation Reminder', category: 'Consultations', description: 'Reminder before a consultation session',
    render: () => MailTpl.tplConsultationReminder('Ahmed', 'client', 'Dr. Youssef', 'Video Call', 'Jan 20, 2025 10:00 AM', 30, 'https://meet.google.com/abc', 'https://sakan.app/consultations/1') },
  { slug: 'consultation-completed', name: 'Consultation Completed', category: 'Consultations', description: 'Sent after a consultation is completed',
    render: () => MailTpl.tplConsultationCompleted('Ahmed', 'Dr. Youssef', 'Video Call', 'EGP 250', 'EGP', 'https://sakan.app/consultations/1/review') },
  { slug: 'consultation-instapay-pending', name: 'Consultation InstaPay Pending', category: 'Consultations', description: 'Waiting for InstaPay proof for consultation',
    render: () => MailTpl.tplConsultationInstapayPending('Ahmed', 'Dr. Youssef', 'Video Call', 'Jan 20, 2025 10:00 AM', 'EGP 250', 'EGP', '+201000000000', 'Oikivo Payments', 'CB-001', 'https://sakan.app/consultations/1') },

  // Consultant management
  { slug: 'consultant-application-decision', name: 'Consultant Application Decision', category: 'Consultations', description: 'Approval or rejection of consultant application',
    render: () => MailTpl.tplConsultantApplicationDecision('Dr. Youssef', 'approved', null, 'https://sakan.app/consultant/dashboard', 'https://sakan.app/become-consultant') },
  { slug: 'consultant-suspended', name: 'Consultant Suspended Notice', category: 'Consultations', description: 'Notifies clients when a consultant is suspended',
    render: () => MailTpl.tplConsultantSuspendedClientNotice('Ahmed', 'Dr. Youssef', 'Jan 20, 2025 10:00 AM', 'CB-001', 'https://sakan.app/consultations') },
  { slug: 'consultant-approved-notice', name: 'Consultant Approved Notice', category: 'Consultations', description: 'Notifies clients when their consultant is approved',
    render: () => MailTpl.tplConsultantApprovedClientNotice('Ahmed', 'Dr. Youssef', 'https://sakan.app/consultant/youssef') },
  { slug: 'consultation-payment-received', name: 'Consultation Payment Received', category: 'Consultations', description: 'Payment confirmation for consultant',
    render: () => MailTpl.tplConsultationPaymentReceived('Dr. Youssef', 'Ahmed', 'Video Call', 'Jan 20, 2025 10:00 AM', 'EGP 250', 'EGP', 'CB-001', 'https://sakan.app/consultant/bookings/1') },
  { slug: 'consultant-payout-processed', name: 'Consultant Payout Processed', category: 'Consultations', description: 'Payout confirmation for consultant',
    render: () => MailTpl.tplConsultantPayoutProcessed('Dr. Youssef', 'EGP 225', 'EGP', 'bank_transfer', 'completed', null, 'https://sakan.app/consultant/payouts') },
];

@Injectable()
export class AdminService {
  private dashboardCache: { data: any; cachedAt: number } = { data: null, cachedAt: 0 };
  private static readonly DASHBOARD_CACHE_TTL = 60_000; // 60 seconds

  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(ReviewEntity)
    private reviewsRepo: Repository<ReviewEntity>,
    @InjectRepository(PayoutEntity)
    private payoutsRepo: Repository<PayoutEntity>,
    @InjectRepository(EarningEntity)
    private earningsRepo: Repository<EarningEntity>,
    @InjectRepository(ExperienceBookingEntity)
    private expBookingsRepo: Repository<ExperienceBookingEntity>,
    @InjectRepository(PlatformSettingEntity)
    private settingsRepo: Repository<PlatformSettingEntity>,
    @InjectRepository(NotificationEntity)
    private notificationsRepo: Repository<NotificationEntity>,
    @InjectRepository(CategoryEntity)
    private categoriesRepo: Repository<CategoryEntity>,
    @InjectRepository(AmenityEntity)
    private amenitiesRepo: Repository<AmenityEntity>,
    @InjectRepository(ConsultantEntity)
    private consultantsRepo: Repository<ConsultantEntity>,
    @InjectRepository(ConsultationBookingEntity)
    private consultBookingsRepo: Repository<ConsultationBookingEntity>,
    @InjectRepository(ConversationEntity)
    private conversationsRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messagesRepo: Repository<MessageEntity>,
    @InjectRepository(AdminActivityLogEntity)
    private activityLogRepo: Repository<AdminActivityLogEntity>,
    @InjectRepository(ExpenseEntity)
    private expensesRepo: Repository<ExpenseEntity>,
    private dataSource: DataSource,
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
    private mail: MailService,
  ) {}

  // ─── Users ─────────────────────────────────────────────────────────────────
  async getUsers(
    page = 1,
    limit = 20,
    search?: string,
    role?: string,
    sortBy: 'createdAt' | 'firstName' | 'email' = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    idVerificationStatus?: string,
  ) {
    const allowedSort = ['createdAt', 'firstName', 'email'] as const;
    const safeSort = allowedSort.includes(sortBy as any) ? sortBy : 'createdAt';
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .orderBy(`u.${safeSort}`, sortOrder === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where(
        'u.email LIKE :s OR u.firstName LIKE :s OR u.lastName LIKE :s OR u.phone LIKE :s',
        { s: `%${search}%` },
      );
    }

    if (role === 'host') qb.andWhere('u.isHost = true');
    else if (role === 'admin') qb.andWhere('u.isAdmin = true');
    else if (role === 'guest') qb.andWhere('u.isHost = false AND u.isAdmin = false');

    if (idVerificationStatus) qb.andWhere('u.idVerificationStatus = :ivs', { ivs: idVerificationStatus });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserActive(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    await this.usersRepo.save(user);
    return { message: user.isActive ? 'User activated' : 'User suspended', isActive: user.isActive };
  }

  async toggleUserAdmin(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isAdmin = !user.isAdmin;
    await this.usersRepo.save(user);
    return { message: user.isAdmin ? 'Admin role granted' : 'Admin role revoked', isAdmin: user.isAdmin };
  }

  async reviewIdDocument(userId: number, approved: boolean, rejectionReason?: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.idDocumentUrl) throw new BadRequestException('No ID document submitted by this user');
    (user as any).isIdVerified = approved;
    (user as any).idVerificationStatus = approved ? 'approved' : 'rejected';
    (user as any).idRejectionReason = approved ? null : (rejectionReason ?? null);
    await this.usersRepo.save(user);
    return { message: approved ? 'ID approved — user is now ID verified' : 'ID rejected', isIdVerified: approved };
  }

  async bulkUserAction(ids: number[], action: 'activate' | 'deactivate' | 'grant_admin' | 'revoke_admin') {
    if (!ids.length) throw new BadRequestException('No user IDs provided');
    const users = await this.usersRepo.findByIds(ids);
    for (const user of users) {
      if (action === 'activate') user.isActive = true;
      else if (action === 'deactivate') user.isActive = false;
      else if (action === 'grant_admin') user.isAdmin = true;
      else if (action === 'revoke_admin') user.isAdmin = false;
    }
    await this.usersRepo.save(users);
    return { affected: users.length };
  }

  async bulkPropertyStatus(ids: number[], status: 'draft' | 'pending_review' | 'published' | 'archived') {
    if (!ids.length) throw new BadRequestException('No property IDs provided');
    await this.propertiesRepo
      .createQueryBuilder()
      .update()
      .set({ status, isActive: status === 'published' } as any)
      .where('id IN (:...ids)', { ids })
      .execute();
    return { affected: ids.length };
  }

  // ─── Properties ────────────────────────────────────────────────────────────
  async getProperties(status?: string, page = 1, limit = 20, search?: string) {
    const qb = this.propertiesRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.host', 'host')
      .leftJoinAndSelect('p.photos', 'photos')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('p.status = :status', { status });
    if (search) {
      const clause = 'p.title LIKE :s OR p.city LIKE :s OR p.country LIKE :s';
      status ? qb.andWhere(clause, { s: `%${search}%` }) : qb.where(clause, { s: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async togglePropertyStatus(propertyId: number, status: 'draft' | 'pending_review' | 'published' | 'archived') {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    property.status = status;
    property.isActive = status === 'published';
    return this.propertiesRepo.save(property);
  }

  // ─── Bookings ───────────────────────────────────────────────────────────────
  async getBookings(page = 1, limit = 20, status?: string, search?: string) {
    const qb = this.bookingsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.property', 'property')
      .leftJoinAndSelect('b.guest', 'guest')
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('b.status = :status', { status });
    if (search) {
      const clause = 'guest.email LIKE :s OR guest.firstName LIKE :s OR property.title LIKE :s';
      status ? qb.andWhere(clause, { s: `%${search}%` }) : qb.where(clause, { s: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async confirmPayment(bookingId: number) {
    return this.bookingsService.confirmPayment(bookingId, 0, true);
  }

  async declinePayment(bookingId: number, reason?: string) {
    return this.bookingsService.declinePayment(bookingId, 0, true, reason);
  }

  async markInstapayRefunded(bookingId: number, reason?: string) {
    return this.bookingsService.markInstapayRefunded(bookingId, reason);
  }

  /** 2.3 — Cancelled InstaPay bookings with paymentStatus = 'paid' awaiting manual refund */
  async getInstapayRefundsPending() {
    return this.bookingsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.property', 'property')
      .leftJoinAndSelect('b.guest', 'guest')
      .where('b.status = :status', { status: 'cancelled' })
      .andWhere('b.paymentMethod = :method', { method: 'instapay' })
      .andWhere('b.paymentStatus = :paymentStatus', { paymentStatus: 'paid' })
      .orderBy('b.cancelledAt', 'DESC')
      .getMany();
  }

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  async getReviews(page = 1, limit = 20, search?: string) {
    const qb = this.reviewsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reviewer', 'guest')
      .leftJoinAndSelect('r.property', 'property')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where(
        'guest.firstName LIKE :s OR guest.lastName LIKE :s OR guest.email LIKE :s OR property.title LIKE :s',
        { s: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    // Remap reviewer → guest for frontend compatibility
    const mappedItems = items.map((r: any) => ({ ...r, guest: r.reviewer }));
    return { items: mappedItems, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteReview(reviewId: number) {
    const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewsRepo.remove(review);
    return { message: 'Review deleted' };
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboardStats(from?: string, to?: string) {
    // Return cached stats if within TTL (no date filter = default dashboard)
    if (!from && !to && this.dashboardCache.data && Date.now() - this.dashboardCache.cachedAt < AdminService.DASHBOARD_CACHE_TTL) {
      return this.dashboardCache.data;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().split('T')[0];

    // Period boundaries for the date-range filter (defaults to current month)
    const periodStart = from ? new Date(from) : startOfMonth;
    const periodEnd = to
      ? (() => { const d = new Date(to); d.setHours(23, 59, 59, 999); return d; })()
      : now;

    const [
      totalUsers, activeUsers, totalHosts, newThisMonth, newThisWeek,
      totalProperties, publishedProperties, draftProperties, archivedProperties,
      totalBookings, completedBookings, pendingBookings, confirmedBookings, cancelledBookings,
      todayCheckIns, todayCheckOuts,
      revenueTotal, revenueMonth, revenueWeek,
      recentBookings,
      pendingPayouts, openDisputes, pendingIdVerifications, pendingInstapayRefunds,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { isActive: true } }),
      this.usersRepo.count({ where: { isHost: true } }),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM users WHERE created_at >= ?`, [startOfMonth],
      ).then((r: any[]) => parseInt(r[0].cnt)),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM users WHERE created_at >= ?`, [startOfWeek],
      ).then((r: any[]) => parseInt(r[0].cnt)),
      this.propertiesRepo.count(),
      this.propertiesRepo.count({ where: { status: 'published' } }),
      this.propertiesRepo.count({ where: { status: 'draft' } }),
      this.propertiesRepo.count({ where: { status: 'archived' } }),
      this.bookingsRepo.count(),
      this.bookingsRepo.count({ where: { status: 'completed' } }),
      this.bookingsRepo.count({ where: { status: 'pending' } }),
      this.bookingsRepo.count({ where: { status: 'confirmed' } }),
      this.bookingsRepo.count({ where: { status: 'cancelled' } }),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM bookings WHERE check_in = ?`, [todayStr],
      ).then((r: any[]) => parseInt(r[0].cnt)),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM bookings WHERE check_out = ?`, [todayStr],
      ).then((r: any[]) => parseInt(r[0].cnt)),
      this.bookingsRepo.createQueryBuilder('b').select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.paymentStatus = :ps', { ps: 'paid' }).getRawOne(),
      this.bookingsRepo.createQueryBuilder('b').select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.paymentStatus = :ps', { ps: 'paid' }).andWhere('b.createdAt >= :d', { d: startOfMonth }).getRawOne(),
      this.bookingsRepo.createQueryBuilder('b').select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.paymentStatus = :ps', { ps: 'paid' }).andWhere('b.createdAt >= :d', { d: startOfWeek }).getRawOne(),
      this.bookingsRepo.find({
        relations: ['property', 'guest'],
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.payoutsRepo.count({ where: { status: 'pending' } }),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM disputes WHERE status = 'open'`)
        .then((r: any[]) => parseInt(r[0].cnt)),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM users WHERE id_verification_status = 'pending'`)
        .then((r: any[]) => parseInt(r[0].cnt)),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM bookings WHERE status = 'cancelled' AND payment_method = 'instapay' AND payment_status = 'paid'`)
        .then((r: any[]) => parseInt(r[0].cnt, 10)),
    ]);

    const result = {
      users: { total: totalUsers, active: activeUsers, hosts: totalHosts, guests: totalUsers - totalHosts, newThisMonth, newThisWeek },
      properties: { total: totalProperties, published: publishedProperties, draft: draftProperties, archived: archivedProperties },
      bookings: { total: totalBookings, completed: completedBookings, pending: pendingBookings, confirmed: confirmedBookings, cancelled: cancelledBookings, todayCheckIns, todayCheckOuts },
      revenue: {
        total: parseFloat(revenueTotal?.v ?? '0'),
        thisMonth: parseFloat(revenueMonth?.v ?? '0'),
        thisWeek: parseFloat(revenueWeek?.v ?? '0'),
        currency: 'EGP',
      },
      pendingActions: {
        pendingPayouts,
        openDisputes,
        pendingIdVerifications,
        pendingInstapayRefunds,
      },
      recentBookings,
      period: await this._getPeriodStats(periodStart, periodEnd),
    };

    // Cache default dashboard (no date filter)
    if (!from && !to) {
      this.dashboardCache = { data: result, cachedAt: Date.now() };
    }
    return result;
  }

  private async _getPeriodStats(periodStart: Date, periodEnd: Date) {
    const [newUsers, revenueRaw, bookings, confirmed, cancelled] = await Promise.all([
      this.dataSource
        .query(
          `SELECT COUNT(*) AS cnt FROM users WHERE created_at >= ? AND created_at <= ?`,
          [periodStart, periodEnd],
        )
        .then((r: any[]) => parseInt(r[0].cnt, 10)),
      this.bookingsRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.paymentStatus = :ps', { ps: 'paid' })
        .andWhere('b.createdAt >= :pStart', { pStart: periodStart })
        .andWhere('b.createdAt <= :pEnd', { pEnd: periodEnd })
        .getRawOne(),
      this.bookingsRepo.count({ where: { createdAt: Between(periodStart, periodEnd) } }),
      this.bookingsRepo.count({ where: { status: 'confirmed', createdAt: Between(periodStart, periodEnd) } }),
      this.bookingsRepo.count({ where: { status: 'cancelled', createdAt: Between(periodStart, periodEnd) } }),
    ]);
    return {
      from: periodStart.toISOString(),
      to: periodEnd.toISOString(),
      newUsers,
      revenue: parseFloat(revenueRaw?.v ?? '0'),
      bookings,
      confirmedBookings: confirmed,
      cancelledBookings: cancelled,
    };
  }

  async getRevenueChart(from?: string, to?: string) {
    const params: string[] = [];
    let dateFilter: string;
    if (from) {
      params.push(from);
      dateFilter = 'created_at >= ?';
      if (to) {
        params.push(to + ' 23:59:59');
        dateFilter += ' AND created_at <= ?';
      }
    } else {
      dateFilter = 'created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)';
    }
    const rows = await this.dataSource.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COALESCE(SUM(total_amount), 0)   AS revenue,
        COUNT(*)                          AS bookings
      FROM bookings
      WHERE payment_status = 'paid'
        AND ${dateFilter}
      GROUP BY month
      ORDER BY month ASC
    `, params);
    return rows.map((r: any) => ({
      month: r.month,
      revenue: parseFloat(r.revenue),
      bookings: parseInt(r.bookings),
    }));
  }

  // ─── Payouts ────────────────────────────────────────────────────────────────
  async getPayouts(page = 1, limit = 20, status?: string) {
    const qb = this.payoutsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.host', 'host')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('p.status = :status', { status });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async processPayout(payoutId: number, status: 'processing' | 'completed' | 'failed', adminNote?: string) {
    const payout = await this.payoutsRepo.findOne({
      where: { id: payoutId },
      relations: ['host'],
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status === 'completed') throw new BadRequestException('Payout already completed');

    payout.status = status;
    if (adminNote) payout.note = adminNote;
    if (status === 'completed') {
      payout.processedAt = new Date();
    }
    const saved = await this.payoutsRepo.save(payout);

    if (status === 'completed' && payout.host) {
      const host = payout.host;
      const amountStr = Number(payout.amount).toFixed(2);
      const currency = payout.currency ?? 'EGP';
      const ref = `PO-${payout.id}`;

      // In-app notification
      await this.notificationsService.create(
        host.id,
        'payout_completed',
        'Payout Processed',
        'تم تحويل المدفوعات',
        `Your payout of ${amountStr} ${currency} has been transferred.`,
        `تم تحويل ${amountStr} ${currency} إلى حسابك.`,
        { payoutId: payout.id },
      );

      // Email notification
      try {
        const fe = process.env.FRONTEND_URL?.split(',')?.[0]?.trim() ?? 'http://localhost:3000';
        const earningsUrl = `${fe.replace(/\/+$/, '')}/en/hosting/earnings`;
        const processedDate = saved.processedAt
          ? new Date(saved.processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        await this.mail.send(
          host.email,
          `Payout of ${amountStr} ${currency} processed — Oikivo`,
          tplPayoutProcessed(
            host.firstName,
            amountStr,
            currency,
            payout.method ?? 'bank_transfer',
            payout.accountDetails ?? 'N/A',
            ref,
            processedDate,
            earningsUrl,
          ),
        );
      } catch (e) {
        // Non-fatal — log only
        console.error(`[AdminService] Failed to send payout completion email: ${(e as Error).message}`);
      }
    }

    return saved;
  }

  // ─── Experience Bookings ────────────────────────────────────────────────────
  async getExperienceBookings(page = 1, limit = 20, status?: string, search?: string) {
    const qb = this.expBookingsRepo
      .createQueryBuilder('eb')
      .leftJoinAndSelect('eb.experience', 'exp')
      .leftJoinAndSelect('eb.guest', 'guest')
      .leftJoinAndSelect('eb.host', 'host')
      .orderBy('eb.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('eb.status = :status', { status });

    if (search) {
      qb.andWhere(
        'guest.firstName LIKE :s OR guest.lastName LIKE :s OR guest.email LIKE :s OR exp.title LIKE :s',
        { s: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async confirmExperiencePayment(id: number) {
    const booking = await this.expBookingsRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Experience booking not found');
    booking.paymentStatus = 'paid';
    return this.expBookingsRepo.save(booking);
  }

  // ─── Platform Settings ──────────────────────────────────────────────────────
  async getSettings() {
    return this.settingsRepo.find({ order: { key: 'ASC' } });
  }

  async updateSetting(key: string, value: string) {
    let setting = await this.settingsRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingsRepo.create({ key, value });
    } else {
      setting.value = value;
    }
    return this.settingsRepo.save(setting);
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────
  async getAnalytics(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const [totalBookings, completedBookings, cancelledBookings, revenueData, userGrowth, recentProperties] =
      await Promise.all([
        this.bookingsRepo.createQueryBuilder('b')
          .where('b.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
          .getCount(),
        this.bookingsRepo.createQueryBuilder('b')
          .where('b.status = :s', { s: 'completed' })
          .andWhere('b.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
          .getCount(),
        this.bookingsRepo.createQueryBuilder('b')
          .where('b.status = :s', { s: 'cancelled' })
          .andWhere('b.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
          .getCount(),
        this.dataSource.query(`
          SELECT DATE_FORMAT(created_at,'%Y-%m') AS month,
            COALESCE(SUM(total_amount),0) AS revenue,
            COUNT(*) AS bookings
          FROM bookings
          WHERE payment_status = 'paid'
            AND created_at BETWEEN ? AND ?
          GROUP BY month ORDER BY month ASC
        `, [fromDate, toDate]),
        this.dataSource.query(`
          SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS users
          FROM users
          WHERE created_at BETWEEN ? AND ?
          GROUP BY month ORDER BY month ASC
        `, [fromDate, toDate]),
        this.dataSource.query(`
          SELECT DATE_FORMAT(created_at,'%Y-%m') AS month,
            SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published,
            SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS draft
          FROM properties
          WHERE created_at BETWEEN ? AND ?
          GROUP BY month ORDER BY month ASC
        `, [fromDate, toDate]),
      ]);

    const totalRevenue = (revenueData as any[]).reduce((s, r) => s + parseFloat(r.revenue), 0);
    const avgBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    return {
      period: { from: fromDate, to: toDate },
      totals: {
        bookings: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        revenue: totalRevenue,
        avgBookingValue,
        conversionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0',
        cancellationRate: totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : '0',
      },
      revenueByMonth: (revenueData as any[]).map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue),
        bookings: parseInt(r.bookings),
      })),
      userGrowthByMonth: (userGrowth as any[]).map((r) => ({
        month: r.month,
        users: parseInt(r.users),
      })),
      propertiesByMonth: (recentProperties as any[]).map((r) => ({
        month: r.month,
        published: parseInt(r.published),
        draft: parseInt(r.draft),
      })),
    };
  }

  // ─── Notification Blast ────────────────────────────────────────────────────
  async getNotificationHistory(page = 1, limit = 20) {
    const [items, total] = await this.notificationsRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async sendNotificationBlast(
    audience: 'all' | 'hosts' | 'guests',
    type: string,
    title: string,
    message: string,
  ) {
    let users: UserEntity[];
    if (audience === 'hosts') {
      users = await this.usersRepo.find({ where: { isHost: true, isActive: true } });
    } else if (audience === 'guests') {
      users = await this.usersRepo.find({ where: { isHost: false, isAdmin: false, isActive: true } });
    } else {
      users = await this.usersRepo.find({ where: { isActive: true } });
    }

    for (const user of users) {
      await this.notificationsService.create(
        user.id, type, title, title, message, message, { blast: true, audience },
      );
    }
    return { sent: users.length, audience, type, title };
  }

  // ─── Badge Counts (lightweight nav indicators) ────────────────────────────
  async getBadgeCounts() {
    const [pendingPayouts, openDisputes, pendingVerifications, pendingInstapayRefunds] = await Promise.all([
      this.payoutsRepo.count({ where: { status: 'pending' } }),
      this.dataSource
        .query(`SELECT COUNT(*) AS cnt FROM disputes WHERE status = 'open'`)
        .then((r: any[]) => parseInt(r[0].cnt, 10)),
      this.dataSource
        .query(`SELECT COUNT(*) AS cnt FROM users WHERE id_verification_status = 'pending'`)
        .then((r: any[]) => parseInt(r[0].cnt, 10)),
      this.dataSource
        .query(`SELECT COUNT(*) AS cnt FROM bookings WHERE status = 'cancelled' AND payment_method = 'instapay' AND payment_status = 'paid'`)
        .then((r: any[]) => parseInt(r[0].cnt, 10)),
    ]);
    return { pendingPayouts, openDisputes, pendingVerifications, pendingInstapayRefunds };
  }

  // ─── System Health ─────────────────────────────────────────────────────────
  async getSystemHealth() {
    const start = Date.now();
    let dbStatus: 'ok' | 'error' = 'ok';
    let dbLatencyMs = 0;
    let totalUsers = 0;
    let totalProperties = 0;
    let totalBookings = 0;

    try {
      const t0 = Date.now();
      [totalUsers, totalProperties, totalBookings] = await Promise.all([
        this.usersRepo.count(),
        this.propertiesRepo.count(),
        this.bookingsRepo.count(),
      ]);
      dbLatencyMs = Date.now() - t0;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      api: 'ok',
      database: dbStatus,
      dbLatencyMs,
      apiLatencyMs: Date.now() - start,
      storage: 'ok',
      queue: 'ok',
      counts: { totalUsers, totalProperties, totalBookings },
      checkedAt: new Date().toISOString(),
    };
  }

  // ─── Email Blast ───────────────────────────────────────────────────────────
  async sendEmailBlast(
    subject: string,
    body: string,
    audience: 'all' | 'hosts' | 'guests',
  ) {
    let users: UserEntity[];
    if (audience === 'hosts') {
      users = await this.usersRepo.find({ where: { isHost: true, isActive: true } });
    } else if (audience === 'guests') {
      users = await this.usersRepo.find({ where: { isHost: false, isAdmin: false, isActive: true } });
    } else {
      users = await this.usersRepo.find({ where: { isActive: true } });
    }

    let sent = 0;
    for (const user of users) {
      try {
        await this.mail.sendAdminBlast(user.email, user.firstName ?? 'User', subject, body);
        sent++;
      } catch { /* skip individual failures */ }
    }
    return { sent, total: users.length, audience, subject };
  }

  async sendTestEmail(subject: string, body: string, recipientEmail: string) {
    await this.mail.sendAdminBlast(recipientEmail, 'Admin', `[TEST] ${subject}`, body);
    return { sent: 1, recipientEmail, subject };
  }

  // ─── User Detail + CRUD ────────────────────────────────────────────────────
  async getUserDetail(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['properties', 'bookings', 'reviews'],
    });
    if (!user) throw new NotFoundException('User not found');
    const [bookingCount, propertyCount, reviewCount, totalSpent] = await Promise.all([
      this.bookingsRepo.count({ where: { guestId: userId } }),
      this.propertiesRepo.count({ where: { hostId: userId } }),
      this.reviewsRepo.count({ where: { reviewerId: userId } }),
      this.bookingsRepo.createQueryBuilder('b')
        .select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.guestId = :uid', { uid: userId })
        .andWhere('b.paymentStatus = :ps', { ps: 'paid' })
        .getRawOne(),
    ]);
    return {
      ...user,
      stats: {
        bookingCount,
        propertyCount,
        reviewCount,
        totalSpent: parseFloat(totalSpent?.v ?? '0'),
      },
    };
  }

  async updateUser(userId: number, data: Partial<{
    firstName: string; lastName: string; email: string; phone: string;
    bio: string; isHost: boolean; isActive: boolean; isAdmin: boolean;
  }>) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, data);
    return this.usersRepo.save(user);
  }

  async deleteUser(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isAdmin) throw new BadRequestException('Cannot delete an admin user');
    await this.usersRepo.remove(user);
    return { message: 'User deleted' };
  }

  async banUser(userId: number, reason: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isAdmin) throw new BadRequestException('Cannot ban an admin user');
    user.isActive = false;
    await this.usersRepo.save(user);
    await this.notificationsService.create(
      userId, 'account_banned', 'Account Suspended',
      'تم إيقاف الحساب',
      `Your account has been suspended. Reason: ${reason}`,
      `تم إيقاف حسابك. السبب: ${reason}`,
      { reason },
    );
    return { message: 'User banned', reason };
  }

  // ─── Property Detail + CRUD ─────────────────────────────────────────────────
  async getPropertyDetail(propertyId: number) {
    const property = await this.propertiesRepo.findOne({
      where: { id: propertyId },
      relations: ['host', 'photos', 'amenities', 'category', 'houseRules', 'reviews', 'bookings'],
    });
    if (!property) throw new NotFoundException('Property not found');
    const [bookingCount, revenueRaw] = await Promise.all([
      this.bookingsRepo.count({ where: { propertyId } }),
      this.bookingsRepo.createQueryBuilder('b')
        .select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.propertyId = :pid', { pid: propertyId })
        .andWhere('b.paymentStatus = :ps', { ps: 'paid' })
        .getRawOne(),
    ]);
    return {
      ...property,
      stats: { bookingCount, totalRevenue: parseFloat(revenueRaw?.v ?? '0') },
    };
  }

  async updateProperty(propertyId: number, data: Partial<{
    title: string; description: string; pricePerNight: number;
    cleaningFee: number; status: string; maxGuests: number;
    bedrooms: number; bathrooms: number; beds: number;
    minNights: number; maxNights: number; city: string; country: string;
    cancellationPolicy: string; isActive: boolean;
  }>) {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    Object.assign(property, data);
    if (data.status === 'published') property.isActive = true;
    if (data.status === 'archived') property.isActive = false;
    return this.propertiesRepo.save(property);
  }

  async deleteProperty(propertyId: number) {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    await this.propertiesRepo.remove(property);
    return { message: 'Property deleted' };
  }

  // ─── Booking Detail + Admin Actions ─────────────────────────────────────────
  async getBookingDetail(bookingId: number) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['property', 'guest', 'host', 'review'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateBooking(bookingId: number, data: Partial<{
    status: string; paymentStatus: string; paymentNote: string;
    guestNote: string; specialRequests: string;
  }>) {
    const booking = await this.bookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    Object.assign(booking, data);
    return this.bookingsRepo.save(booking);
  }

  async adminCancelBooking(bookingId: number, reason: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['guest', 'host', 'property'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (['cancelled', 'completed'].includes(booking.status)) {
      throw new BadRequestException(`Booking is already ${booking.status}`);
    }
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'admin';
    booking.cancellationReason = reason;
    const saved = await this.bookingsRepo.save(booking);
    // Notify guest
    if (booking.guest) {
      await this.notificationsService.create(
        booking.guestId, 'booking_cancelled', 'Booking Cancelled by Admin',
        'تم إلغاء الحجز من قبل الإدارة',
        `Your booking #${booking.id} has been cancelled by admin. Reason: ${reason}`,
        `تم إلغاء حجزك #${booking.id} من قبل الإدارة. السبب: ${reason}`,
        { bookingId: booking.id },
      );
    }
    return saved;
  }

  async adminRefund(bookingId: number, amount: number, reason: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['guest'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (amount > Number(booking.totalAmount)) {
      throw new BadRequestException('Refund amount exceeds total booking amount');
    }
    booking.refundAmount = amount;
    booking.refundReason = reason;
    booking.paymentStatus = 'refunded';
    const saved = await this.bookingsRepo.save(booking);
    if (booking.guest) {
      await this.notificationsService.create(
        booking.guestId, 'refund_issued', 'Refund Issued',
        'تم إصدار استرداد',
        `A refund of ${Number(amount).toFixed(2)} ${booking.currency} has been issued for booking #${booking.id}. Reason: ${reason}`,
        `تم إصدار استرداد ${Number(amount).toFixed(2)} ${booking.currency} للحجز #${booking.id}. السبب: ${reason}`,
        { bookingId: booking.id, amount },
      );
    }
    return saved;
  }

  // ─── Categories CRUD ───────────────────────────────────────────────────────
  async getCategories() {
    return this.categoriesRepo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async createCategory(data: { name: string; nameAr: string; icon: string; description?: string; sortOrder?: number }) {
    const cat = this.categoriesRepo.create(data);
    return this.categoriesRepo.save(cat);
  }

  async updateCategory(id: number, data: Partial<{ name: string; nameAr: string; icon: string; description: string; sortOrder: number; isActive: boolean }>) {
    const cat = await this.categoriesRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    Object.assign(cat, data);
    return this.categoriesRepo.save(cat);
  }

  async deleteCategory(id: number) {
    const cat = await this.categoriesRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.categoriesRepo.remove(cat);
    return { message: 'Category deleted' };
  }

  // ─── Amenities CRUD ───────────────────────────────────────────────────────
  async getAmenities() {
    return this.amenitiesRepo.find({ order: { category: 'ASC', sortOrder: 'ASC', name: 'ASC' } });
  }

  async createAmenity(data: { name: string; nameAr: string; icon: string; category?: string; sortOrder?: number }) {
    const amenity = this.amenitiesRepo.create(data);
    return this.amenitiesRepo.save(amenity);
  }

  async updateAmenity(id: number, data: Partial<{ name: string; nameAr: string; icon: string; category: string; sortOrder: number }>) {
    const amenity = await this.amenitiesRepo.findOne({ where: { id } });
    if (!amenity) throw new NotFoundException('Amenity not found');
    Object.assign(amenity, data);
    return this.amenitiesRepo.save(amenity);
  }

  async deleteAmenity(id: number) {
    const amenity = await this.amenitiesRepo.findOne({ where: { id } });
    if (!amenity) throw new NotFoundException('Amenity not found');
    await this.amenitiesRepo.remove(amenity);
    return { message: 'Amenity deleted' };
  }

  // ─── Consultant Detail ─────────────────────────────────────────────────────
  async getConsultantDetail(consultantId: number) {
    const consultant = await this.consultantsRepo.findOne({
      where: { id: consultantId },
      relations: ['user', 'documents', 'availability'],
    });
    if (!consultant) throw new NotFoundException('Consultant not found');
    const [bookingCount, earningsRaw, reviewCount] = await Promise.all([
      this.consultBookingsRepo.count({ where: { consultantId } }),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount),0) AS v FROM consultant_earnings WHERE consultant_id = ? AND status IN ('available','paid')`,
        [consultantId],
      ).then((r: any[]) => parseFloat(r[0]?.v ?? '0')),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM consultation_reviews WHERE consultant_id = ?`,
        [consultantId],
      ).then((r: any[]) => parseInt(r[0]?.cnt ?? '0')),
    ]);
    return {
      ...consultant,
      stats: { bookingCount, totalEarnings: earningsRaw, reviewCount },
    };
  }

  // ─── Enhanced Analytics ────────────────────────────────────────────────────
  async getEnhancedAnalytics(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const [
      base,
      topProperties,
      topHosts,
      revenueByPaymentMethod,
      bookingsByCity,
      avgBookingDuration,
      repeatGuestRate,
      topCancellationReasons,
      consultationStats,
    ] = await Promise.all([
      this.getAnalytics(from, to),
      this.dataSource.query(`
        SELECT p.id, p.title, p.city, COUNT(b.id) AS bookings,
          COALESCE(SUM(b.total_amount),0) AS revenue
        FROM properties p
        LEFT JOIN bookings b ON b.property_id = p.id AND b.payment_status = 'paid'
          AND b.created_at BETWEEN ? AND ?
        GROUP BY p.id ORDER BY revenue DESC LIMIT 10
      `, [fromDate, toDate]),
      this.dataSource.query(`
        SELECT u.id, u.first_name, u.last_name, u.email,
          COUNT(DISTINCT p.id) AS properties,
          COALESCE(SUM(b.total_amount),0) AS revenue
        FROM users u
        JOIN properties p ON p.host_id = u.id
        LEFT JOIN bookings b ON b.property_id = p.id AND b.payment_status = 'paid'
          AND b.created_at BETWEEN ? AND ?
        WHERE u.is_host = 1
        GROUP BY u.id ORDER BY revenue DESC LIMIT 10
      `, [fromDate, toDate]),
      this.dataSource.query(`
        SELECT payment_method, COUNT(*) AS cnt,
          COALESCE(SUM(total_amount),0) AS revenue
        FROM bookings
        WHERE payment_status = 'paid' AND created_at BETWEEN ? AND ?
        GROUP BY payment_method ORDER BY revenue DESC
      `, [fromDate, toDate]),
      this.dataSource.query(`
        SELECT p.city, COUNT(b.id) AS bookings
        FROM bookings b
        JOIN properties p ON p.id = b.property_id
        WHERE b.created_at BETWEEN ? AND ?
        GROUP BY p.city ORDER BY bookings DESC LIMIT 10
      `, [fromDate, toDate]),
      this.dataSource.query(`
        SELECT AVG(nights) AS avg_nights FROM bookings
        WHERE created_at BETWEEN ? AND ?
      `, [fromDate, toDate]).then((r: any[]) => parseFloat(r[0]?.avg_nights ?? '0')),
      this.dataSource.query(`
        SELECT
          ROUND(COUNT(DISTINCT CASE WHEN bc > 1 THEN guest_id END) * 100.0 / NULLIF(COUNT(DISTINCT guest_id),0), 1) AS rate
        FROM (SELECT guest_id, COUNT(*) AS bc FROM bookings WHERE created_at BETWEEN ? AND ? GROUP BY guest_id) sub
      `, [fromDate, toDate]).then((r: any[]) => parseFloat(r[0]?.rate ?? '0')),
      this.dataSource.query(`
        SELECT cancellation_reason AS reason, COUNT(*) AS cnt
        FROM bookings
        WHERE status = 'cancelled' AND cancellation_reason IS NOT NULL
          AND created_at BETWEEN ? AND ?
        GROUP BY cancellation_reason ORDER BY cnt DESC LIMIT 5
      `, [fromDate, toDate]),
      this.dataSource.query(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
          COALESCE(SUM(CASE WHEN payment_status='paid' THEN price ELSE 0 END),0) AS revenue
        FROM consultation_bookings WHERE created_at BETWEEN ? AND ?
      `, [fromDate, toDate]),
    ]);

    return {
      ...base,
      topProperties: (topProperties as any[]).map(r => ({
        id: r.id, title: r.title, city: r.city,
        bookings: parseInt(r.bookings), revenue: parseFloat(r.revenue),
      })),
      topHosts: (topHosts as any[]).map(r => ({
        id: r.id, name: `${r.first_name} ${r.last_name}`, email: r.email,
        properties: parseInt(r.properties), revenue: parseFloat(r.revenue),
      })),
      revenueByPaymentMethod: (revenueByPaymentMethod as any[]).map(r => ({
        method: r.payment_method, count: parseInt(r.cnt), revenue: parseFloat(r.revenue),
      })),
      bookingsByCity: (bookingsByCity as any[]).map(r => ({
        city: r.city, bookings: parseInt(r.bookings),
      })),
      avgBookingDuration: avgBookingDuration,
      repeatGuestRate,
      topCancellationReasons: (topCancellationReasons as any[]).map(r => ({
        reason: r.reason, count: parseInt(r.cnt),
      })),
      consultations: {
        total: parseInt((consultationStats as any[])[0]?.total ?? '0'),
        completed: parseInt((consultationStats as any[])[0]?.completed ?? '0'),
        revenue: parseFloat((consultationStats as any[])[0]?.revenue ?? '0'),
      },
    };
  }

  // ─── Create User ───────────────────────────────────────────────────────────
  async createUser(data: {
    firstName: string; lastName: string; email: string;
    password: string; phone?: string; isHost?: boolean; isAdmin?: boolean;
  }) {
    const existing = await this.usersRepo.findOne({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Email already in use');
    const hashed = await bcrypt.hash(data.password, 10);
    const user = this.usersRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash: hashed,
      phone: data.phone,
      isHost: data.isHost ?? false,
      isAdmin: data.isAdmin ?? false,
      isActive: true,
      isEmailVerified: true,
    });
    return this.usersRepo.save(user);
  }

  // ─── Adjust Booking Amounts ────────────────────────────────────────────────
  async adjustBookingAmounts(bookingId: number, data: {
    baseAmount?: number; cleaningFee?: number; serviceFee?: number; totalAmount?: number;
    reason: string;
  }) {
    const booking = await this.bookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const changes: Array<{ field: string; from: unknown; to: unknown }> = [];
    if (data.baseAmount !== undefined && data.baseAmount !== Number(booking.baseAmount)) {
      changes.push({ field: 'baseAmount', from: booking.baseAmount, to: data.baseAmount });
      booking.baseAmount = data.baseAmount;
    }
    if (data.cleaningFee !== undefined && data.cleaningFee !== Number(booking.cleaningFee)) {
      changes.push({ field: 'cleaningFee', from: booking.cleaningFee, to: data.cleaningFee });
      booking.cleaningFee = data.cleaningFee;
    }
    if (data.serviceFee !== undefined && data.serviceFee !== Number(booking.serviceFee)) {
      changes.push({ field: 'serviceFee', from: booking.serviceFee, to: data.serviceFee });
      booking.serviceFee = data.serviceFee;
    }
    if (data.totalAmount !== undefined && data.totalAmount !== Number(booking.totalAmount)) {
      changes.push({ field: 'totalAmount', from: booking.totalAmount, to: data.totalAmount });
      booking.totalAmount = data.totalAmount;
    }

    if (changes.length === 0) throw new BadRequestException('No changes detected');

    const history = booking.modificationHistory ?? [];
    history.push({ changedAt: new Date().toISOString(), changedBy: 'admin', changes });
    booking.modificationHistory = history;

    return this.bookingsRepo.save(booking);
  }

  // ─── Featured Property Toggle ──────────────────────────────────────────────
  async toggleFeatured(propertyId: number) {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    const current = (property as any).isFeatured ?? false;
    (property as any).isFeatured = !current;
    await this.propertiesRepo.save(property);
    return { message: current ? 'Property unfeatured' : 'Property featured', isFeatured: !current };
  }

  // ─── Commission Override ───────────────────────────────────────────────────
  async updateCommission(propertyId: number, serviceFeePercent: number) {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (serviceFeePercent < 0 || serviceFeePercent > 50) {
      throw new BadRequestException('Service fee must be between 0% and 50%');
    }
    property.serviceFeePercent = serviceFeePercent;
    return this.propertiesRepo.save(property);
  }

  // ─── Flag/Unflag Review ────────────────────────────────────────────────────
  async flagReview(reviewId: number, flagged: boolean, adminNote?: string) {
    const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    // Use raw query to set flag since column may not be in entity yet
    await this.dataSource.query(
      `UPDATE reviews SET is_flagged = ?, admin_note = ? WHERE id = ?`,
      [flagged ? 1 : 0, adminNote ?? null, reviewId],
    );
    return { message: flagged ? 'Review flagged' : 'Review unflagged', isFlagged: flagged };
  }

  // ─── Individual User Notification ──────────────────────────────────────────
  async sendUserNotification(userId: number, title: string, message: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.notificationsService.create(
      userId, 'admin_message', title, title, message, message, { fromAdmin: true },
    );
    return { message: 'Notification sent', userId, title };
  }

  // ─── User Activity Timeline ────────────────────────────────────────────────
  async getUserActivityTimeline(userId: number) {
    const [bookings, reviews, properties, adminActions] = await Promise.all([
      this.bookingsRepo.find({
        where: { guestId: userId },
        select: ['id', 'status', 'checkIn', 'totalAmount', 'currency', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.reviewsRepo.find({
        where: { reviewerId: userId },
        select: ['id', 'overallRating', 'comment', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.propertiesRepo.find({
        where: { hostId: userId },
        select: ['id', 'title', 'status', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.activityLogRepo.find({
        where: { entityId: String(userId), entityType: 'user' },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);

    const timeline: Array<{ type: string; date: string; detail: any }> = [];
    bookings.forEach(b => timeline.push({ type: 'booking', date: (b.createdAt as any)?.toISOString?.() ?? b.createdAt as any, detail: b }));
    reviews.forEach(r => timeline.push({ type: 'review', date: (r.createdAt as any)?.toISOString?.() ?? r.createdAt as any, detail: r }));
    properties.forEach(p => timeline.push({ type: 'property', date: (p.createdAt as any)?.toISOString?.() ?? p.createdAt as any, detail: p }));
    adminActions.forEach(a => timeline.push({ type: 'admin_action', date: (a as any).timestamp?.toISOString?.() ?? (a as any).timestamp, detail: a }));

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return timeline.slice(0, 50);
  }

  // ─── Message Threads (Admin read-only) ─────────────────────────────────────
  async getConversations(page = 1, limit = 20, search?: string) {
    const qb = this.conversationsRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.host', 'host')
      .leftJoinAndSelect('c.guest', 'guest')
      .leftJoinAndSelect('c.property', 'property')
      .orderBy('c.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where(
        'host.firstName LIKE :s OR host.lastName LIKE :s OR guest.firstName LIKE :s OR guest.lastName LIKE :s OR host.email LIKE :s OR guest.email LIKE :s',
        { s: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getConversationMessages(conversationId: number, page = 1, limit = 50) {
    const conversation = await this.conversationsRepo.findOne({
      where: { id: conversationId },
      relations: ['host', 'guest', 'property'],
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const [messages, total] = await this.messagesRepo.findAndCount({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { conversation, messages, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Data Export ───────────────────────────────────────────────────────────
  async getExportData(type: 'bookings' | 'users' | 'properties' | 'payouts' | 'reviews' | 'disputes', page = 1, limit = 5000) {
    const take = Math.min(limit, 5000);
    const skip = (page - 1) * take;
    switch (type) {
      case 'bookings':
        return this.bookingsRepo.find({ relations: ['property', 'guest', 'host'], order: { createdAt: 'DESC' }, skip, take });
      case 'users':
        return this.usersRepo.find({ order: { createdAt: 'DESC' }, skip, take });
      case 'properties':
        return this.propertiesRepo.find({ relations: ['host', 'category'], order: { createdAt: 'DESC' }, skip, take });
      case 'payouts':
        return this.payoutsRepo.find({ relations: ['host'], order: { createdAt: 'DESC' }, skip, take });
      case 'reviews':
        return this.reviewsRepo.find({ relations: ['reviewer', 'property'], order: { createdAt: 'DESC' }, skip, take });
      case 'disputes':
        return this.dataSource.query(`SELECT * FROM disputes ORDER BY created_at DESC LIMIT ? OFFSET ?`, [take, skip]);
      default:
        throw new BadRequestException('Invalid export type');
    }
  }

  // ─── Experience Booking Detail ──────────────────────────────────────────────
  async getExperienceBookingDetail(id: number) {
    const booking = await this.expBookingsRepo.findOne({
      where: { id },
      relations: ['experience', 'guest', 'host', 'review'],
    });
    if (!booking) throw new NotFoundException('Experience booking not found');
    return booking;
  }

  // ─── Batch Process Payouts ──────────────────────────────────────────────────
  async batchProcessPayouts(ids: number[], status: 'processing' | 'completed' | 'failed', adminNote?: string) {
    if (!ids.length) throw new BadRequestException('No payout IDs provided');
    const results: Array<{ id: number; success: boolean; error?: string }> = [];
    for (const id of ids) {
      try {
        await this.processPayout(id, status, adminNote);
        results.push({ id, success: true });
      } catch (e) {
        results.push({ id, success: false, error: (e as Error).message });
      }
    }
    return { processed: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results };
  }

  // ─── Email Templates ────────────────────────────────────────────────────────
  getEmailTemplates() {
    return EMAIL_TEMPLATE_REGISTRY.map(({ slug, name, category, description }) => ({ slug, name, category, description }));
  }

  previewEmailTemplate(slug: string) {
    const tpl = EMAIL_TEMPLATE_REGISTRY.find(t => t.slug === slug);
    if (!tpl) throw new NotFoundException('Email template not found');
    return { slug: tpl.slug, name: tpl.name, category: tpl.category, html: tpl.render() };
  }

  // ─── Gateway fee helpers ────────────────────────────────────────────────────
  private calcGatewayFeeIn(paymentMethod: string | null, amount: number): number {
    if (paymentMethod === 'opay-card' || paymentMethod === 'card') return amount * 0.0225 + 2;
    return 0; // instapay, cash = 0
  }

  private calcPayoutFee(method: string, amount: number): number {
    if (method === 'instapay') return Math.max(Math.min(amount * 0.001, 20), 0.50);
    return 0; // bank_transfer, cash = 0 (manual)
  }

  // ─── Financial Analytics ────────────────────────────────────────────────────
  async getFinancialAnalytics(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // ── Property bookings ──────────────────────────────────────────────
    const propBookings: any[] = await this.dataSource.query(`
      SELECT id, base_amount, cleaning_fee, service_fee, total_amount,
             payment_method, payment_status, status, refund_amount, cancellation_fee,
             host_id, created_at
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
    `, [fromDate, toDate]);

    let propGrossRevenue = 0;
    let propPlatformFees = 0;
    let propGatewayFees = 0;
    let propRefunds = 0;
    let propPaidCount = 0;
    let propRefundedCount = 0;
    const propByMethod: Record<string, { count: number; revenue: number; gatewayFee: number }> = {};

    for (const b of propBookings) {
      const total = parseFloat(b.total_amount) || 0;
      const serviceFee = parseFloat(b.service_fee) || 0;
      const refund = parseFloat(b.refund_amount) || 0;
      const method = b.payment_method || 'unknown';

      if (b.payment_status === 'paid' || b.payment_status === 'refunded') {
        propGrossRevenue += total;
        propPlatformFees += serviceFee;
        const gw = this.calcGatewayFeeIn(method, total);
        propGatewayFees += gw;
        propPaidCount++;

        if (!propByMethod[method]) propByMethod[method] = { count: 0, revenue: 0, gatewayFee: 0 };
        propByMethod[method].count++;
        propByMethod[method].revenue += total;
        propByMethod[method].gatewayFee += gw;
      }
      if (b.payment_status === 'refunded') {
        propRefunds += refund;
        propRefundedCount++;
      }
    }

    // ── Consultation bookings ──────────────────────────────────────────
    const consultBookings: any[] = await this.dataSource.query(`
      SELECT id, price, platform_fee, consultant_payout, payment_method,
             payment_status, status, refund_amount, cancellation_fee,
             consultant_id, created_at
      FROM consultation_bookings
      WHERE created_at BETWEEN ? AND ?
    `, [fromDate, toDate]);

    let consultGrossRevenue = 0;
    let consultPlatformFees = 0;
    let consultGatewayFees = 0;
    let consultRefunds = 0;
    let consultPaidCount = 0;
    let consultRefundedCount = 0;
    const consultByMethod: Record<string, { count: number; revenue: number; gatewayFee: number }> = {};

    for (const c of consultBookings) {
      const price = parseFloat(c.price) || 0;
      const platFee = parseFloat(c.platform_fee) || 0;
      const refund = parseFloat(c.refund_amount) || 0;
      const method = c.payment_method || 'unknown';

      if (c.payment_status === 'paid' || c.payment_status === 'refunded') {
        consultGrossRevenue += price;
        consultPlatformFees += platFee;
        const gw = this.calcGatewayFeeIn(method, price);
        consultGatewayFees += gw;
        consultPaidCount++;

        if (!consultByMethod[method]) consultByMethod[method] = { count: 0, revenue: 0, gatewayFee: 0 };
        consultByMethod[method].count++;
        consultByMethod[method].revenue += price;
        consultByMethod[method].gatewayFee += gw;
      }
      if (c.payment_status === 'refunded') {
        consultRefunds += refund;
        consultRefundedCount++;
      }
    }

    // ── Payouts (host) ─────────────────────────────────────────────────
    const payoutRows: any[] = await this.dataSource.query(`
      SELECT amount, method, status FROM payouts
      WHERE status = 'completed' AND processed_at BETWEEN ? AND ?
    `, [fromDate, toDate]);

    let totalPayouts = 0;
    let totalPayoutFees = 0;
    for (const p of payoutRows) {
      const amt = parseFloat(p.amount) || 0;
      totalPayouts += amt;
      totalPayoutFees += this.calcPayoutFee(p.method, amt);
    }

    // ── Consultant payouts ─────────────────────────────────────────────
    const consultPayoutRows: any[] = await this.dataSource.query(`
      SELECT amount, method, status FROM consultant_payout_requests
      WHERE status = 'completed' AND processed_at BETWEEN ? AND ?
    `, [fromDate, toDate]).catch(() => []);

    let totalConsultPayouts = 0;
    let totalConsultPayoutFees = 0;
    for (const p of consultPayoutRows) {
      const amt = parseFloat(p.amount) || 0;
      totalConsultPayouts += amt;
      totalConsultPayoutFees += this.calcPayoutFee(p.method || 'instapay', amt);
    }

    // ── Expenses ───────────────────────────────────────────────────────
    const expenseRows: any[] = await this.dataSource.query(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
      WHERE date BETWEEN ? AND ?
    `, [fromDate, toDate]);
    const totalExpenses = parseFloat(expenseRows[0]?.total) || 0;

    // ── Host analytics ─────────────────────────────────────────────────
    const hostStats: any[] = await this.dataSource.query(`
      SELECT
        COUNT(DISTINCT u.id) AS total_hosts,
        COUNT(DISTINCT p.id) AS total_properties,
        COUNT(DISTINCT b.id) AS total_bookings,
        COALESCE(SUM(CASE WHEN b.payment_status IN ('paid','refunded') THEN b.total_amount ELSE 0 END), 0) AS gross_revenue
      FROM users u
      JOIN properties p ON p.host_id = u.id
      LEFT JOIN bookings b ON b.property_id = p.id AND b.created_at BETWEEN ? AND ?
      WHERE u.is_host = 1
    `, [fromDate, toDate]);

    const topHosts: any[] = await this.dataSource.query(`
      SELECT u.id, u.first_name, u.last_name, u.email,
        COUNT(DISTINCT p.id) AS properties,
        COUNT(DISTINCT CASE WHEN b.payment_status IN ('paid','refunded') THEN b.id END) AS bookings,
        COALESCE(SUM(CASE WHEN b.payment_status IN ('paid','refunded') THEN b.total_amount ELSE 0 END), 0) AS revenue
      FROM users u
      JOIN properties p ON p.host_id = u.id
      LEFT JOIN bookings b ON b.property_id = p.id AND b.created_at BETWEEN ? AND ?
      WHERE u.is_host = 1
      GROUP BY u.id ORDER BY revenue DESC LIMIT 10
    `, [fromDate, toDate]);

    // ── Consultant analytics ───────────────────────────────────────────
    const consultantStats: any[] = await this.dataSource.query(`
      SELECT
        COUNT(DISTINCT c.id) AS total_consultants,
        COUNT(DISTINCT cb.id) AS total_bookings,
        COALESCE(SUM(CASE WHEN cb.payment_status IN ('paid','refunded') THEN cb.price ELSE 0 END), 0) AS gross_revenue,
        COALESCE(SUM(CASE WHEN cb.payment_status IN ('paid','refunded') THEN cb.platform_fee ELSE 0 END), 0) AS platform_fees
      FROM consultants c
      LEFT JOIN consultation_bookings cb ON cb.consultant_id = c.id AND cb.created_at BETWEEN ? AND ?
    `, [fromDate, toDate]);

    const topConsultants: any[] = await this.dataSource.query(`
      SELECT c.id, u.first_name, u.last_name, u.email, c.specializations,
        COUNT(DISTINCT CASE WHEN cb.payment_status IN ('paid','refunded') THEN cb.id END) AS bookings,
        COALESCE(SUM(CASE WHEN cb.payment_status IN ('paid','refunded') THEN cb.price ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN cb.payment_status IN ('paid','refunded') THEN cb.platform_fee ELSE 0 END), 0) AS platform_fees
      FROM consultants c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN consultation_bookings cb ON cb.consultant_id = c.id AND cb.created_at BETWEEN ? AND ?
      GROUP BY c.id ORDER BY revenue DESC LIMIT 10
    `, [fromDate, toDate]);

    // ── Monthly breakdown ──────────────────────────────────────────────
    const monthlyProp: any[] = await this.dataSource.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS bookings,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(SUM(service_fee), 0) AS platform_fees
      FROM bookings
      WHERE payment_status IN ('paid','refunded') AND created_at BETWEEN ? AND ?
      GROUP BY month ORDER BY month ASC
    `, [fromDate, toDate]);

    const monthlyConsult: any[] = await this.dataSource.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS bookings,
        COALESCE(SUM(price), 0) AS revenue,
        COALESCE(SUM(platform_fee), 0) AS platform_fees
      FROM consultation_bookings
      WHERE payment_status IN ('paid','refunded') AND created_at BETWEEN ? AND ?
      GROUP BY month ORDER BY month ASC
    `, [fromDate, toDate]);

    // ── Profit calc ────────────────────────────────────────────────────
    const allPlatformFees = propPlatformFees + consultPlatformFees;
    const allGatewayFees = propGatewayFees + consultGatewayFees;
    const allPayoutFees = totalPayoutFees + totalConsultPayoutFees;
    const netProfit = allPlatformFees - allGatewayFees - allPayoutFees - totalExpenses;

    return {
      period: { from: fromDate, to: toDate },
      property: {
        grossRevenue: +propGrossRevenue.toFixed(2),
        platformFees: +propPlatformFees.toFixed(2),
        gatewayFees: +propGatewayFees.toFixed(2),
        refunds: +propRefunds.toFixed(2),
        paidBookings: propPaidCount,
        refundedBookings: propRefundedCount,
        totalBookings: propBookings.length,
        byPaymentMethod: propByMethod,
      },
      consultation: {
        grossRevenue: +consultGrossRevenue.toFixed(2),
        platformFees: +consultPlatformFees.toFixed(2),
        gatewayFees: +consultGatewayFees.toFixed(2),
        refunds: +consultRefunds.toFixed(2),
        paidBookings: consultPaidCount,
        refundedBookings: consultRefundedCount,
        totalBookings: consultBookings.length,
        byPaymentMethod: consultByMethod,
      },
      payouts: {
        hostPayouts: +totalPayouts.toFixed(2),
        hostPayoutFees: +totalPayoutFees.toFixed(2),
        consultantPayouts: +totalConsultPayouts.toFixed(2),
        consultantPayoutFees: +totalConsultPayoutFees.toFixed(2),
      },
      expenses: +totalExpenses.toFixed(2),
      profit: {
        totalPlatformFees: +allPlatformFees.toFixed(2),
        totalGatewayCosts: +allGatewayFees.toFixed(2),
        totalPayoutCosts: +allPayoutFees.toFixed(2),
        totalExpenses: +totalExpenses.toFixed(2),
        netProfit: +netProfit.toFixed(2),
      },
      hosts: {
        totalHosts: parseInt(hostStats[0]?.total_hosts ?? '0'),
        totalProperties: parseInt(hostStats[0]?.total_properties ?? '0'),
        totalBookings: parseInt(hostStats[0]?.total_bookings ?? '0'),
        grossRevenue: parseFloat(hostStats[0]?.gross_revenue ?? '0'),
        topHosts: topHosts.map(h => ({
          id: h.id, name: `${h.first_name} ${h.last_name}`, email: h.email,
          properties: parseInt(h.properties), bookings: parseInt(h.bookings),
          revenue: parseFloat(h.revenue),
        })),
      },
      consultants: {
        totalConsultants: parseInt(consultantStats[0]?.total_consultants ?? '0'),
        totalBookings: parseInt(consultantStats[0]?.total_bookings ?? '0'),
        grossRevenue: parseFloat(consultantStats[0]?.gross_revenue ?? '0'),
        platformFees: parseFloat(consultantStats[0]?.platform_fees ?? '0'),
        topConsultants: topConsultants.map(c => ({
          id: c.id, name: `${c.first_name} ${c.last_name}`, email: c.email,
          specializations: c.specializations, bookings: parseInt(c.bookings),
          revenue: parseFloat(c.revenue), platformFees: parseFloat(c.platform_fees),
        })),
      },
      monthly: {
        property: monthlyProp.map(r => ({
          month: r.month, bookings: parseInt(r.bookings),
          revenue: parseFloat(r.revenue), platformFees: parseFloat(r.platform_fees),
        })),
        consultation: monthlyConsult.map(r => ({
          month: r.month, bookings: parseInt(r.bookings),
          revenue: parseFloat(r.revenue), platformFees: parseFloat(r.platform_fees),
        })),
      },
    };
  }

  // ─── Per-Booking Profit ─────────────────────────────────────────────────────
  async getBookingProfit(bookingId: number) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['property', 'guest', 'host'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const total = parseFloat(String(booking.totalAmount)) || 0;
    const serviceFee = parseFloat(String(booking.serviceFee)) || 0;
    const refund = parseFloat(String(booking.refundAmount)) || 0;
    const method = booking.paymentMethod || 'unknown';

    const gatewayFee = this.calcGatewayFeeIn(method, total);

    // Find associated payout
    const payout = await this.payoutsRepo.findOne({
      where: { hostId: booking.hostId },
      order: { createdAt: 'DESC' },
    });
    const payoutFee = payout && payout.status === 'completed'
      ? this.calcPayoutFee(payout.method, parseFloat(String(payout.amount)))
      : 0;

    const netProfit = serviceFee - gatewayFee - payoutFee - (booking.paymentStatus === 'refunded' ? gatewayFee : 0);

    return {
      bookingId: booking.id,
      totalAmount: total,
      serviceFee,
      gatewayFee: +gatewayFee.toFixed(2),
      paymentMethod: method,
      payoutFee: +payoutFee.toFixed(2),
      refundAmount: refund,
      isRefunded: booking.paymentStatus === 'refunded',
      netProfit: +netProfit.toFixed(2),
    };
  }

  // ─── Expense CRUD ───────────────────────────────────────────────────────────
  async getExpenses(page = 1, limit = 20) {
    const [items, total] = await this.expensesRepo.findAndCount({
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createExpense(data: { description: string; amount: number; category?: string; date: string; addedBy?: number }) {
    const expense = this.expensesRepo.create(data);
    return this.expensesRepo.save(expense);
  }

  async updateExpense(id: number, data: Partial<{ description: string; amount: number; category: string; date: string }>) {
    const expense = await this.expensesRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    Object.assign(expense, data);
    return this.expensesRepo.save(expense);
  }

  async deleteExpense(id: number) {
    const expense = await this.expensesRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.expensesRepo.remove(expense);
  }

  // ─── FIX AD1: Payment Transactions ────────────────────────────────────────

  async getPaymentTransactions(
    page = 1,
    limit = 20,
    filters: { method?: string; status?: string; from?: string; to?: string; search?: string },
  ) {
    const qb = this.bookingsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.guest', 'guest')
      .leftJoinAndSelect('b.host', 'host')
      .leftJoinAndSelect('b.property', 'property')
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.method) qb.andWhere('b.paymentMethod = :method', { method: filters.method });
    if (filters.status) qb.andWhere('b.paymentStatus = :status', { status: filters.status });
    if (filters.from) qb.andWhere('b.createdAt >= :from', { from: new Date(filters.from) });
    if (filters.to) qb.andWhere('b.createdAt <= :to', { to: new Date(filters.to) });
    if (filters.search) {
      qb.andWhere(
        '(b.paymentReference LIKE :s OR b.opayOrderReference LIKE :s OR b.stripePaymentIntentId LIKE :s OR CAST(b.id AS CHAR) LIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((b) => ({
        id: b.id,
        type: 'property_booking',
        guestName: b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : null,
        hostName: b.host ? `${b.host.firstName} ${b.host.lastName}` : null,
        propertyTitle: b.property?.title ?? null,
        totalAmount: b.totalAmount,
        serviceFee: b.serviceFee,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        paymentReference: b.paymentReference,
        opayOrderReference: b.opayOrderReference,
        stripePaymentIntentId: b.stripePaymentIntentId,
        createdAt: b.createdAt,
        status: b.status,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── FIX AD7: User Merge / Dedup ─────────────────────────────────────────

  async findDuplicateUsers(search: string) {
    if (!search || search.length < 2) return [];

    const users = await this.usersRepo
      .createQueryBuilder('u')
      .where(
        '(LOWER(u.email) LIKE LOWER(:s) OR u.phone LIKE :s OR LOWER(u.firstName) LIKE LOWER(:s) OR LOWER(u.lastName) LIKE LOWER(:s))',
        { s: `%${search}%` },
      )
      .orderBy('u.createdAt', 'ASC')
      .take(20)
      .getMany();

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      googleId: u.googleId ?? null,
      appleId: u.appleId ?? null,
      isHost: u.isHost,
      isAdmin: u.isAdmin,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  }

  async mergeUsers(keepId: number, mergeId: number, adminId?: number) {
    if (keepId === mergeId) throw new BadRequestException('Cannot merge a user with themselves');

    const keep = await this.usersRepo.findOne({ where: { id: keepId } });
    const merge = await this.usersRepo.findOne({ where: { id: mergeId } });
    if (!keep) throw new NotFoundException('Primary user not found');
    if (!merge) throw new NotFoundException('Secondary user not found');
    if (merge.isAdmin) throw new BadRequestException('Cannot merge an admin account');

    // Transfer all owned data from mergeId → keepId
    await this.dataSource.transaction(async (manager) => {
      await manager.query('UPDATE bookings SET guest_id = ? WHERE guest_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE bookings SET host_id = ? WHERE host_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE properties SET host_id = ? WHERE host_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE reviews SET reviewer_id = ? WHERE reviewer_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE reviews SET host_id = ? WHERE host_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE payouts SET host_id = ? WHERE host_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE earnings SET host_id = ? WHERE host_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE disputes SET raised_by_id = ? WHERE raised_by_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE messages SET sender_id = ? WHERE sender_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE notifications SET user_id = ? WHERE user_id = ?', [keepId, mergeId]);
      await manager.query('UPDATE wishlists SET user_id = ? WHERE user_id = ?', [keepId, mergeId]).catch(() => {});
      await manager.query('UPDATE saved_searches SET user_id = ? WHERE user_id = ?', [keepId, mergeId]).catch(() => {});

      // Inherit host flag if merge user was a host
      if (merge.isHost && !keep.isHost) {
        await manager.update(UserEntity, keepId, { isHost: true });
      }

      // Deactivate the merged account
      await manager.update(UserEntity, mergeId, { isActive: false, email: `merged_${mergeId}_${merge.email}` });

      // Log the merge action
      await manager.save(AdminActivityLogEntity, {
        adminId,
        action: 'MERGE_USERS',
        entityType: 'user',
        entityId: String(keepId),
        details: { keepId, mergeId, mergedEmail: merge.email, mergedName: `${merge.firstName} ${merge.lastName}` },
      });
    });

    return { success: true, keepId, mergeId, message: `User #${mergeId} merged into #${keepId}` };
  }

  // ─── FIX AD9: Notification Templates ──────────────────────────────────────

  private readonly notificationTemplates = [
    // Push notifications
    { slug: 'push-booking-confirmed', type: 'push', name: 'Booking Confirmed', title: 'Booking Confirmed', body: 'Your booking at {{property}} is confirmed!', enabled: true },
    { slug: 'push-booking-cancelled', type: 'push', name: 'Booking Cancelled', title: 'Booking Cancelled', body: 'Your booking at {{property}} has been cancelled.', enabled: true },
    { slug: 'push-new-message', type: 'push', name: 'New Message', title: 'New Message', body: '{{sender}} sent you a message.', enabled: true },
    { slug: 'push-payout-processed', type: 'push', name: 'Payout Processed', title: 'Payout Sent', body: 'Your payout of {{amount}} has been processed.', enabled: true },
    { slug: 'push-review-received', type: 'push', name: 'Review Received', title: 'New Review', body: '{{reviewer}} left a {{rating}}★ review on {{property}}.', enabled: true },
    { slug: 'push-booking-request', type: 'push', name: 'Booking Request', title: 'New Booking Request', body: '{{guest}} wants to book {{property}} ({{dates}}).', enabled: true },
    { slug: 'push-dispute-update', type: 'push', name: 'Dispute Update', title: 'Dispute Updated', body: 'Your dispute #{{disputeId}} has been updated.', enabled: true },
    { slug: 'push-id-verified', type: 'push', name: 'ID Verified', title: 'ID Verified', body: 'Your identity has been verified. You can now list properties.', enabled: true },
    // SMS notifications
    { slug: 'sms-otp-verification', type: 'sms', name: 'OTP Verification', title: '', body: 'Your Sakan verification code is {{otp}}. Valid for 10 minutes.', enabled: true },
    { slug: 'sms-booking-confirmed', type: 'sms', name: 'Booking Confirmed', title: '', body: 'Sakan: Your booking #{{bookingId}} at {{property}} is confirmed for {{dates}}.', enabled: true },
    { slug: 'sms-payout-sent', type: 'sms', name: 'Payout Sent', title: '', body: 'Sakan: Your payout of {{amount}} has been sent to your {{method}} account.', enabled: true },
    { slug: 'sms-booking-reminder', type: 'sms', name: 'Booking Reminder', title: '', body: 'Sakan: Reminder - Your stay at {{property}} starts tomorrow ({{date}}).', enabled: true },
  ];

  getNotificationTemplates() {
    return this.notificationTemplates;
  }

  updateNotificationTemplate(slug: string, data: { title?: string; body?: string; enabled?: boolean }) {
    const tpl = this.notificationTemplates.find((t) => t.slug === slug);
    if (!tpl) throw new NotFoundException('Template not found');
    if (data.title !== undefined) tpl.title = data.title;
    if (data.body !== undefined) tpl.body = data.body;
    if (data.enabled !== undefined) tpl.enabled = data.enabled;
    return tpl;
  }

  // ─── FIX AD11: Host Onboarding Funnel ─────────────────────────────────────

  async getHostOnboardingFunnel() {
    // Stage 1: Registered as host but no property
    const stage1: any[] = await this.dataSource.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
             u.id_document_status
      FROM users u
      WHERE u.is_host = 1 AND u.is_active = 1
        AND u.id NOT IN (SELECT DISTINCT host_id FROM properties)
      ORDER BY u.created_at DESC
    `);

    // Stage 2: Has property but none published
    const stage2: any[] = await this.dataSource.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
             u.id_document_status,
             COUNT(p.id) AS property_count
      FROM users u
      JOIN properties p ON p.host_id = u.id
      WHERE u.is_host = 1 AND u.is_active = 1
        AND u.id NOT IN (SELECT DISTINCT host_id FROM properties WHERE status = 'published')
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Stage 3: Published property but no ID verification
    const stage3: any[] = await this.dataSource.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
             u.id_document_status,
             COUNT(DISTINCT p.id) AS published_properties
      FROM users u
      JOIN properties p ON p.host_id = u.id AND p.status = 'published'
      WHERE u.is_host = 1 AND u.is_active = 1
        AND (u.id_document_status IS NULL OR u.id_document_status != 'approved')
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Stage 4: Verified but no bookings yet
    const stage4: any[] = await this.dataSource.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
             u.id_document_status,
             COUNT(DISTINCT p.id) AS published_properties
      FROM users u
      JOIN properties p ON p.host_id = u.id AND p.status = 'published'
      WHERE u.is_host = 1 AND u.is_active = 1
        AND u.id_document_status = 'approved'
        AND u.id NOT IN (SELECT DISTINCT host_id FROM bookings WHERE status NOT IN ('cancelled'))
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Stage 5: Fully onboarded (has at least one completed booking)
    const stage5Count: any[] = await this.dataSource.query(`
      SELECT COUNT(DISTINCT u.id) AS count
      FROM users u
      JOIN bookings b ON b.host_id = u.id AND b.status IN ('confirmed', 'completed')
      WHERE u.is_host = 1 AND u.is_active = 1
    `);

    return {
      funnel: [
        { stage: 1, label: 'Registered — No Property', count: stage1.length, users: stage1.slice(0, 20) },
        { stage: 2, label: 'Has Property — Not Published', count: stage2.length, users: stage2.slice(0, 20) },
        { stage: 3, label: 'Published — Not Verified', count: stage3.length, users: stage3.slice(0, 20) },
        { stage: 4, label: 'Verified — No Bookings', count: stage4.length, users: stage4.slice(0, 20) },
        { stage: 5, label: 'Fully Onboarded', count: parseInt(stage5Count[0]?.count ?? '0'), users: [] },
      ],
    };
  }
}
