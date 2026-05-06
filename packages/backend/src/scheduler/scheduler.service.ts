import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual, Between, DataSource } from 'typeorm';
import { BookingEntity } from '../entities/booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { PropertyEntity } from '../entities/property.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { DisputeEntity } from '../entities/dispute.entity';
import { WishlistItemEntity } from '../entities/wishlist-item.entity';
import { SavedSearchEntity } from '../entities/saved-search.entity';
import { UserEntity } from '../entities/user.entity';
import { PriceAlertEntity } from '../entities/price-alert.entity';
import { PasswordResetEntity } from '../entities/password-reset.entity';
import { VerificationTokenEntity } from '../entities/verification-token.entity';
import { AvailabilityEntity } from '../entities/availability.entity';
import { ReviewEntity } from '../entities/review.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplInstapayPaymentDeclined, tplPreArrivalReminder, tplMonthlyEarningsSummary, tplBookingAccepted, tplPaymentReminder, tplBookingCancelled, tplReviewRequest } from '../mail/mail.service';
import { PayoutsService } from '../payouts/payouts.service';
import { localDateStr } from '../common/utils/date.util';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(EarningEntity)
    private earningsRepo: Repository<EarningEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(ConsultationBookingEntity)
    private consultationBookingsRepo: Repository<ConsultationBookingEntity>,
    @InjectRepository(DisputeEntity)
    private disputesRepo: Repository<DisputeEntity>,
    @InjectRepository(WishlistItemEntity)
    private wishlistItemsRepo: Repository<WishlistItemEntity>,
    @InjectRepository(SavedSearchEntity)
    private savedSearchesRepo: Repository<SavedSearchEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    @InjectRepository(PriceAlertEntity)
    private priceAlertsRepo: Repository<PriceAlertEntity>,
    @InjectRepository(PasswordResetEntity)
    private passwordResetsRepo: Repository<PasswordResetEntity>,
    @InjectRepository(VerificationTokenEntity)
    private verificationTokensRepo: Repository<VerificationTokenEntity>,
    @InjectRepository(AvailabilityEntity)
    private availabilityRepo: Repository<AvailabilityEntity>,
    @InjectRepository(ReviewEntity)
    private reviewsRepo: Repository<ReviewEntity>,
    @InjectRepository(NotificationEntity)
    private notificationsRepo: Repository<NotificationEntity>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
    private mail: MailService,
    private payoutsService: PayoutsService,
  ) {}

  /**
   * 5.1 — Daily job at 02:00 UTC:
   *   a) Transition confirmed bookings whose check-in date has passed → in_progress
   *   b) Auto-complete in_progress bookings whose check-out date has passed
   *   c) Release pending earnings whose availableAt has passed → available
   *   d) FIX BUG-GH1: Auto-release expired security deposits
   */
  @Cron('0 2 * * *')
  async runDailyJobs(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = localDateStr(today);

    await this.transitionToInProgress(todayStr);
    await this.autoCompleteBookings(todayStr);
    await this.releaseEarnings();
    await this.runAutoPayouts();
    await this.sendPreArrivalReminders(todayStr); // FIX BUG-GL1
    await this.purgeExpiredArchivedListings();
    await this.autoDeclineStalePendingBookings(); // FIX A1
  }

  /**
   * Run status transitions every 10 minutes for near-real-time check-in/check-out
   * status changes. Skips heavy jobs (payouts, earnings release, reminders) — daily only.
   */
  @Cron('*/10 * * * *')
  async runStatusTransitions(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = localDateStr(today);
    await this.transitionToInProgress(todayStr);
    await this.autoCompleteBookings(todayStr);
  }

  // FIX B3: Run every hour — auto-cancel confirmed/pending bookings with no payment after 24 hours
  @Cron('0 * * * *')
  async autoCancelUnpaidBookings(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    try {
      const unpaid = await this.bookingsRepo.find({
        where: [
          { status: 'confirmed', paymentStatus: 'pending' as any, confirmedAt: LessThan(cutoff) },
          { status: 'pending', paymentStatus: 'pending' as any, createdAt: LessThan(cutoff) },
        ],
        relations: ['guest', 'property'],
      });

      if (!unpaid.length) return;

      const ids = unpaid.map((b) => b.id);
      await this.bookingsRepo
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          status: 'cancelled',
          cancelledBy: 'system',
          cancelledAt: new Date(),
          cancellationReason: 'Auto-cancelled: payment not received within 24 hours.',
        } as any)
        .whereInIds(ids)
        .execute();

      // Unblock dates for each auto-cancelled booking
      await Promise.allSettled(
        unpaid.map(async (booking) => {
          const ci = new Date(booking.checkIn);
          const co = new Date(booking.checkOut);
          for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
            await this.availabilityRepo.update(
              { propertyId: booking.propertyId, date: localDateStr(d) },
              { isBlocked: false },
            );
          }
        }),
      );

      // Notify guests
      await Promise.allSettled(
        unpaid.map(async (booking) => {
          await this.notificationsService.create(
            booking.guestId,
            'booking_cancelled',
            'Booking auto-cancelled — payment overdue',
            'تم إلغاء الحجز تلقائياً — تأخر الدفع',
            `Booking #${booking.id} for ${booking.property?.title ?? 'your stay'} was auto-cancelled because payment was not received within 24 hours.`,
            `تم إلغاء الحجز #${booking.id} لـ ${booking.property?.title ?? 'إقامتك'} تلقائياً لعدم استلام الدفع خلال 24 ساعة.`,
            { bookingId: booking.id },
          );
          if (booking.guest?.email) {
            await this.mail.send(
              booking.guest.email,
              'Booking cancelled — payment overdue — Oikivo',
              tplBookingCancelled(
                booking.guest.firstName,
                'guest',
                booking.property?.title ?? 'your booking',
                booking.checkIn,
                booking.checkOut,
                `#${booking.id}`,
              ),
            ).catch(() => {});
          }
        }),
      );

      this.logger.log(`[CRON] ${unpaid.length} unpaid booking(s) auto-cancelled after 24h deadline`);
    } catch (err) {
      this.logger.error(`[CRON] Error auto-cancelling unpaid bookings: ${(err as Error).message}`);
    }
  }

  // Run every 30 minutes to release held deposits promptly after 48h deadline.
  @Cron('*/30 * * * *')
  async runDepositReleaseJob(): Promise<void> {
    await this.autoReleaseExpiredDeposits();
  }

  /** a) confirmed → in_progress:
   *   - checkIn < today  → always (guest is already overdue)
   *   - checkIn = today  → only if current local time >= property.checkInAfter
   */
  private async transitionToInProgress(todayStr: string): Promise<void> {
    try {
      // 1. Past check-in dates — transition unconditionally
      const pastBookings = await this.bookingsRepo.find({
        where: { status: 'confirmed', checkIn: LessThan(todayStr) },
      });

      // 2. Today's check-ins — load property to read checkInAfter time
      const todayBookings = await this.bookingsRepo.find({
        where: { status: 'confirmed', checkIn: todayStr },
        relations: ['property'],
      });

      const now = new Date();
      const todayReady = todayBookings.filter((b) => {
        const timezone = b.property?.timezone || 'Africa/Cairo';
        const nowInTz = toZonedTime(now, timezone);
        const nowMinutes = nowInTz.getHours() * 60 + nowInTz.getMinutes();
        const checkInAfter: string = b.property?.checkInAfter ?? '15:00:00';
        const [h, m] = checkInAfter.split(':').map(Number);
        return nowMinutes >= h * 60 + m;
      });

      const toTransition = [...pastBookings, ...todayReady];
      if (toTransition.length === 0) return;

      await this.bookingsRepo.update(
        toTransition.map((b) => b.id),
        { status: 'in_progress' },
      );

      this.logger.log(`[CRON] ${toTransition.length} booking(s) transitioned to in_progress (${pastBookings.length} past, ${todayReady.length} today)`);
    } catch (err) {
      this.logger.error(`[CRON] Error transitioning bookings to in_progress: ${(err as Error).message}`);
    }
  }

  /** b) in_progress → completed:
   *   - checkOut < today  → always (already past checkout day)
   *   - checkOut = today  → only if current local time >= property.checkOutBefore
   */
  private async autoCompleteBookings(todayStr: string): Promise<void> {
    try {
      // 1. Past checkout dates — transition unconditionally
      const pastBookings = await this.bookingsRepo.find({
        where: { status: 'in_progress', checkOut: LessThan(todayStr) },
        relations: ['property', 'guest'],
      });

      // 2. Today's checkouts — load property to read checkOutBefore time
      const todayBookings = await this.bookingsRepo.find({
        where: { status: 'in_progress', checkOut: todayStr },
        relations: ['property', 'guest'],
      });

      const now = new Date();
      const todayReady = todayBookings.filter((b) => {
        const timezone = b.property?.timezone || 'Africa/Cairo';
        const nowInTz = toZonedTime(now, timezone);
        const nowMinutes = nowInTz.getHours() * 60 + nowInTz.getMinutes();
        const checkOutBefore: string = b.property?.checkOutBefore ?? '11:00:00';
        const [h, m] = checkOutBefore.split(':').map(Number);
        return nowMinutes >= h * 60 + m;
      });

      const bookings = [...pastBookings, ...todayReady];
      if (bookings.length === 0) return;

      const completedAt = new Date();

      // FIX B2: Only mark as 'paid' if payment was actually received; preserve original paymentStatus otherwise
      const paidBookingIds = bookings.filter((b) => b.paymentStatus === 'paid').map((b) => b.id);
      const unpaidBookingIds = bookings.filter((b) => b.paymentStatus !== 'paid').map((b) => b.id);

      if (paidBookingIds.length > 0) {
        await this.bookingsRepo.update(paidBookingIds, { status: 'completed', paymentStatus: 'paid', completedAt } as any);
      }
      if (unpaidBookingIds.length > 0) {
        await this.bookingsRepo.update(unpaidBookingIds, { status: 'completed', completedAt } as any);
        this.logger.warn(`[CRON] ${unpaidBookingIds.length} booking(s) auto-completed with unpaid payment status: ${unpaidBookingIds.join(', ')}`);
      }

      // Notify guest + host to leave reviews (best-effort)
      await Promise.allSettled(
        bookings.flatMap((b) => [
          this.notificationsService.create(
            b.guestId,
            'review_request',
            'How was your stay?',
            'كيف كانت إقامتك؟',
            `Your stay at ${b.property?.title ?? 'the property'} is complete. Share your experience!`,
            `اكتملت إقامتك في ${b.property?.title ?? 'العقار'}. شارك تجربتك!`,
            { bookingId: b.id, propertyId: b.propertyId },
          ),
          this.notificationsService.create(
            b.hostId,
            'review_request',
            'Review your guest',
            'قيّم ضيفك',
            `${b.guest?.firstName ?? 'Your guest'}'s stay has ended. Leave a review.`,
            `انتهت إقامة ${b.guest?.firstName ?? 'ضيفك'}. اترك تقييمًا.`,
            { bookingId: b.id, guestId: b.guestId },
          ),
        ]),
      );

      this.logger.log(`[CRON] ${bookings.length} booking(s) auto-completed (${pastBookings.length} past, ${todayReady.length} today)`);
    } catch (err) {
      this.logger.error(`[CRON] Error auto-completing bookings: ${(err as Error).message}`);
    }
  }

  /** c) Advance pending earnings whose availableAt has passed to available */
  private async releaseEarnings(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.earningsRepo
        .createQueryBuilder()
        .update(EarningEntity)
        .set({ status: 'available' })
        .where('status = :status', { status: 'pending' })
        .andWhere('available_at <= :now', { now })
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(`[CRON] ${result.affected} earning(s) released to available`);
      }
    } catch (err) {
      this.logger.error(`[CRON] Error releasing earnings: ${(err as Error).message}`);
    }
  }

  private async runAutoPayouts(): Promise<void> {
    try {
      const result = await this.payoutsService.runScheduledAutoPayouts();
      if (result.processed > 0) {
        this.logger.log(`[CRON] ${result.processed} auto payout(s) submitted (${result.skipped} skipped)`);
      }
    } catch (err) {
      this.logger.error(`[CRON] Error running auto payouts: ${(err as Error).message}`);
    }
  }

  /** d) FIX BUG-GH1: Auto-release security deposits after 48h claim deadline */
  private async autoReleaseExpiredDeposits(): Promise<void> {
    try {
      const now = new Date();
      const releasable = await this.bookingsRepo.find({
        where: {
          depositStatus: 'held',
          depositClaimDeadline: LessThanOrEqual(now),
        },
        relations: ['guest'],
      });

      if (!releasable.length) return;

      for (const booking of releasable) {
        booking.depositStatus = 'released';
        booking.depositReleasedAt = now;
        await this.bookingsRepo.save(booking);

        await this.notificationsService.create(
          booking.guestId,
          'deposit_released',
          'Security Deposit Released',
          'تم الإفراج عن مبلغ التأمين',
          `Your security deposit for booking #${booking.id} has been released.`,
          `تم الإفراج عن مبلغ التأمين للحجز #${booking.id}.`,
          { bookingId: booking.id },
        ).catch(() => {});
      }

      this.logger.log(`[CRON] ${releasable.length} security deposit(s) auto-released after claim deadline`);
    } catch (err) {
      this.logger.error(`[CRON] Error auto-releasing deposits: ${(err as Error).message}`);
    }
  }

  /** e) FIX BUG-GL1: Send pre-arrival reminders 3 days and 1 day before check-in */
  private async sendPreArrivalReminders(todayStr: string): Promise<void> {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const threeDaysStr = localDateStr(threeDaysFromNow);

      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      const oneDayStr = localDateStr(oneDayFromNow);

      // Find bookings checking in 3 days or 1 day from now
      const upcomingBookings = await this.bookingsRepo.find({
        where: [
          { status: 'confirmed', checkIn: threeDaysStr },
          { status: 'confirmed', checkIn: oneDayStr },
        ],
        relations: ['guest', 'host', 'property'],
      });

      for (const booking of upcomingBookings) {
        if (!booking.guest || !booking.property) continue;

        const feBase = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:3000';
        const tripsUrl = `${feBase.replace(/\/+$/, '')}/en/trips`;

        const daysUntilCheckIn = booking.checkIn === threeDaysStr ? 3 : 1;
        const subject = daysUntilCheckIn === 3
          ? 'Your stay is in 3 days — Oikivo'
          : 'Your stay is tomorrow — Oikivo';

        await this.mail.send(
          booking.guest.email,
          subject,
          tplPreArrivalReminder(
            booking.guest.firstName,
            booking.property.title,
            booking.checkIn,
            booking.checkOut,
            booking.property.checkInAfter ?? '15:00',
            booking.host?.firstName ?? 'Host',
            booking.host?.phone ?? null,
            booking.property.checkInInstructions ?? null,
            booking.property.address ?? 'Property address',
            `#${booking.id}`,
            tripsUrl,
          ),
        );
      }

      if (upcomingBookings.length > 0) {
        this.logger.log(`[CRON] ${upcomingBookings.length} pre-arrival reminder(s) sent`);
      }
    } catch (err) {
      this.logger.error(`[CRON] Error sending pre-arrival reminders: ${(err as Error).message}`);
    }
  }

  /**
   * G16 — Hourly at :45 — Auto-decline consultation bookings with no response after 24 hours.
   */
  @Cron('45 * * * *')
  async autoDeclineUnansweredConsultations(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const stale = await this.consultationBookingsRepo.find({
        where: { status: 'pending', createdAt: LessThan(cutoff) },
        relations: ['client'],
      });
      if (!stale.length) return;

      for (const booking of stale) {
        booking.status = 'cancelled';
        (booking as any).cancelledBy = 'system';
        booking.cancellationReason = 'Auto-cancelled: consultant did not respond within 24 hours.';
        if (booking.paymentStatus === 'paid') {
          booking.paymentStatus = 'refund_pending';
          booking.refundAmount = Number(booking.price);
        }
        await this.consultationBookingsRepo.save(booking);

        if (booking.clientId) {
          await this.notificationsService.create(
            booking.clientId,
            'booking_declined',
            'Consultation request auto-cancelled',
            'تم إلغاء طلب الاستشارة تلقائيًا',
            `Booking #${booking.id} was not accepted within 24 hours and has been automatically cancelled. Any payment will be refunded.`,
            `لم يتم قبول الحجز #${booking.id} خلال 24 ساعة وتم إلغاؤه تلقائيًا. سيتم استرداد أي مبلغ مدفوع.`,
            { consultationBookingId: booking.id },
          );
        }
      }
      this.logger.log(`[CRON] ${stale.length} unanswered consultation(s) auto-cancelled`);
    } catch (err) {
      this.logger.error(`[CRON] Auto-decline consultations error: ${(err as Error).message}`);
    }
  }

  /**
   * G15 — Every 15 minutes — Send pre-session reminder to client + consultant for sessions starting in 15–30 min.
   */
  @Cron('*/15 * * * *')
  async sendPreSessionReminders(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 15 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 30 * 60 * 1000);
    try {
      const upcoming = await this.consultationBookingsRepo.find({
        where: {
          status: 'confirmed',
          scheduledAt: Between(windowStart, windowEnd),
          preSessionReminderSent: false as any,
        },
        relations: ['client', 'consultant'],
      });
      if (!upcoming.length) return;

      for (const booking of upcoming) {
        const meetingNote = booking.meetingLink
          ? `Meeting link: ${booking.meetingLink}`
          : 'Check your bookings page for the meeting link.';

        await this.notificationsService.create(
          booking.clientId,
          'consultation_reminder',
          'Your consultation starts in ~15 minutes',
          'استشارتك تبدأ خلال ~15 دقيقة',
          `Your ${booking.durationMinutes}-min consultation is starting soon. ${meetingNote}`,
          `استشارتك مدة ${booking.durationMinutes} دقيقة ستبدأ قريبًا. ${meetingNote}`,
          { consultationBookingId: booking.id, meetingLink: booking.meetingLink },
        );

        if (booking.consultant?.userId) {
          await this.notificationsService.create(
            booking.consultant.userId,
            'consultation_reminder',
            'Upcoming consultation in ~15 minutes',
            'استشارة قادمة خلال ~15 دقيقة',
            `You have a ${booking.durationMinutes}-min consultation starting soon.`,
            `لديك استشارة مدة ${booking.durationMinutes} دقيقة ستبدأ قريبًا.`,
            { consultationBookingId: booking.id },
          );
        }

        await this.consultationBookingsRepo.update(booking.id, { preSessionReminderSent: true as any });
      }
      this.logger.log(`[CRON] ${upcoming.length} pre-session reminder(s) sent`);
    } catch (err) {
      this.logger.error(`[CRON] Pre-session reminders error: ${(err as Error).message}`);
    }
  }

  /**
   * G12 — Hourly at :30 — Auto-escalate disputes that have been open for 30+ days.
   */
  @Cron('30 * * * *')
  async autoEscalateOpenDisputes(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
      const stale = await this.disputesRepo.find({
        where: { status: 'open', createdAt: LessThan(cutoff) },
      });
      if (!stale.length) return;

      const ids = stale.map(d => d.id);
      await this.disputesRepo
        .createQueryBuilder()
        .update(DisputeEntity)
        .set({ status: 'under_review' })
        .whereInIds(ids)
        .execute();

      for (const dispute of stale) {
        await this.notificationsService.create(
          dispute.raisedById,
          'dispute_escalated',
          'Your dispute has been escalated',
          'تم تصعيد نزاعك',
          `Dispute #${dispute.id} has been open for 30+ days and was automatically escalated to our review team.`,
          `النزاع #${dispute.id} مفتوح منذ أكثر من 30 يومًا وتم تصعيده تلقائيًا إلى فريق المراجعة.`,
          { disputeId: dispute.id },
        );
      }
      this.logger.log(`[CRON] ${ids.length} dispute(s) auto-escalated to under_review`);
    } catch (err) {
      this.logger.error(`[CRON] Auto-escalate disputes error: ${(err as Error).message}`);
    }
  }

  /**
   * Hourly job: auto-decline InstaPay submissions that have been in 'submitted'
   * state for more than 24 hours without admin action.
   */
  @Cron('0 * * * *')
  async autoDeclineStaleInstapaySubmissions(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const stale = await this.bookingsRepo.find({
        where: {
          paymentStatus: 'submitted' as any,
          updatedAt: LessThan(cutoff),
        },
        relations: ['guest', 'property'],
      });

      if (stale.length === 0) return;

      const ids = stale.map((b) => b.id);
      // WF-02: cancel booking AND decline payment so dates get freed
      await this.bookingsRepo
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          paymentStatus: 'declined',
          paymentNote: 'Auto-declined: no admin action within 24 hours',
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: 'system',
        } as any)
        .whereInIds(ids)
        .execute();

      // Unblock dates for each auto-cancelled stale InstaPay booking
      await Promise.allSettled(
        stale.map(async (booking) => {
          const ci = new Date(booking.checkIn);
          const co = new Date(booking.checkOut);
          for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
            await this.availabilityRepo.update(
              { propertyId: booking.propertyId, date: localDateStr(d) },
              { isBlocked: false },
            );
          }
        }),
      );

      this.logger.log(`[CRON] ${stale.length} stale InstaPay submission(s) auto-declined`);

      // Notify each guest and send email (best-effort)
      await Promise.allSettled(
        stale.map(async (booking) => {
          await this.notificationsService.create(
            booking.guestId,
            'payment_declined',
            'Payment Could Not Be Verified',
            'تعذّر التحقق من الدفع',
            `Your InstaPay payment for booking #${booking.id} could not be verified within 24 hours. Please go to My Trips and retry.`,
            `تعذّر التحقق من دفعك للحجز #${booking.id} خلال 24 ساعة. يرجى الانتقال إلى رحلاتي والمحاولة مرة أخرى.`,
            { bookingId: booking.id },
          );
          if (booking.guest?.email) {
            await this.mail.send(
              booking.guest.email,
              'Payment could not be verified — Oikivo',
              tplInstapayPaymentDeclined(
                booking.guest.firstName,
                `#${booking.id}`,
                booking.property?.title ?? 'your booking',
                'No admin response within 24 hours. Please retry.',
                '#',
              ),
            ).catch((e) => {
              this.logger.warn(`[CRON] Failed to email guest ${booking.guest.email}: ${(e as Error).message}`);
            });
          }
        }),
      );
    } catch (err) {
      this.logger.error(`[CRON] Error auto-declining stale submissions: ${(err as Error).message}`);
    }
  }

  /**
   * d) Permanently delete archived properties that have been archived
   *    for more than 30 days. Moved here from getArchivedListings so the
   *    read endpoint has no hidden write side-effects.
   */
  private async purgeExpiredArchivedListings(): Promise<void> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      // FIX O6: Load cascade relations (photos, houseRules) so TypeORM cascade delete works correctly.
      // Bookings/reviews use DB-level ON DELETE CASCADE via FK constraints.
      const expired = await this.propertiesRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.photos', 'photos')
        .leftJoinAndSelect('p.houseRules', 'rules')
        .where('p.status = :status', { status: 'archived' })
        .andWhere('p.archivedAt IS NOT NULL')
        .andWhere('p.archivedAt <= :cutoff', { cutoff })
        .getMany();

      if (!expired.length) return;

      // Remove one-by-one so a single FK failure doesn't abort the entire batch
      let purged = 0;
      for (const prop of expired) {
        try {
          await this.propertiesRepo.remove(prop);
          purged++;
        } catch (err) {
          this.logger.warn(`[CRON] Failed to purge property #${prop.id}: ${(err as Error).message}`);
        }
      }
      if (purged > 0) {
        this.logger.log(`[CRON] ${purged} expired archived listing(s) purged`);
      }
    } catch (err) {
      this.logger.error(`[CRON] Error purging archived listings: ${(err as Error).message}`);
    }
  }

  /**
   * G8 — Saved search alerts: every 6 hours, check saved searches with alerts enabled
   * and notify users if new matching properties have been listed since the last alert.
   */
  @Cron('0 */6 * * *')
  async runSavedSearchAlerts(): Promise<void> {
    try {
      const searches = await this.savedSearchesRepo.find({
        where: { alertEnabled: true },
      });
      if (!searches.length) return;

      for (const search of searches) {
        try {
          const since = search.lastAlertedAt ?? search.createdAt;
          const filters = search.filters as any;

          // Build a simple query for new properties matching the saved search filters
          const qb = this.propertiesRepo
            .createQueryBuilder('p')
            .where('p.status = :status', { status: 'active' })
            .andWhere('p.createdAt > :since', { since });

          if (filters.city) qb.andWhere('p.city = :city', { city: filters.city });
          if (filters.governorate) qb.andWhere('p.governorate = :gov', { gov: filters.governorate });
          if (filters.priceMin) qb.andWhere('p.pricePerNight >= :pMin', { pMin: filters.priceMin });
          if (filters.priceMax) qb.andWhere('p.pricePerNight <= :pMax', { pMax: filters.priceMax });
          if (filters.minRating) qb.andWhere('p.averageRating >= :minR', { minR: filters.minRating });

          const count = await qb.getCount();
          if (count > 0) {
            await this.notificationsService.create(
              search.userId,
              'saved_search_alert',
              `${count} new listing${count > 1 ? 's' : ''} match "${search.name}"`,
              `${count} عقار${count > 1 ? 'ات' : ''} جديد يطابق "${search.name}"`,
              `We found ${count} new propert${count > 1 ? 'ies' : 'y'} matching your saved search "${search.name}".`,
              `وجدنا ${count} عقار${count > 1 ? 'ات' : ''} جديد يطابق بحثك المحفوظ "${search.name}".`,
              { savedSearchId: search.id, count },
            );
          }

          // Update lastAlertedAt regardless so we don't re-check the same window
          await this.savedSearchesRepo.update(search.id, { lastAlertedAt: new Date() });
        } catch (err) {
          this.logger.error(`[CRON] Saved search alert error for id=${search.id}: ${(err as Error).message}`);
        }
      }

      this.logger.log(`[CRON] Processed ${searches.length} saved search alert(s)`);
    } catch (err) {
      this.logger.error(`[CRON] Error running saved search alerts: ${(err as Error).message}`);
    }
  }

  /**
   * G17 — Price drop alerts: every 6 hours, check if properties have dropped to/below target price.
   */
  @Cron('0 1,7,13,19 * * *')
  async runPriceDropAlerts(): Promise<void> {
    try {
      const alerts = await this.priceAlertsRepo.find({ where: { active: true } });
      if (!alerts.length) return;

      const propertyIds = [...new Set(alerts.map((a) => a.propertyId))];
      const properties = await this.propertiesRepo.findByIds(propertyIds);
      const priceMap = new Map(properties.map((p) => [p.id, Number(p.pricePerNight)]));

      let notified = 0;
      for (const alert of alerts) {
        const currentPrice = priceMap.get(alert.propertyId);
        if (currentPrice === undefined) continue;

        if (currentPrice <= Number(alert.targetPrice) && currentPrice !== Number(alert.lastKnownPrice)) {
          await this.notificationsService.create(
            alert.userId,
            'price_drop',
            'Price drop alert!',
            'تنبيه انخفاض السعر!',
            `A property you\'re watching just dropped to ${currentPrice}/night — below your target of ${alert.targetPrice}.`,
            `انخفض سعر عقار تراقبه إلى ${currentPrice}/ليلة — أقل من هدفك ${alert.targetPrice}.`,
            { propertyId: alert.propertyId, currentPrice, targetPrice: alert.targetPrice },
          );
          alert.notifiedAt = new Date();
          alert.active = false; // one-time alert
          notified++;
        }
        alert.lastKnownPrice = currentPrice;
        await this.priceAlertsRepo.save(alert);
      }

      if (notified) this.logger.log(`[CRON] Sent ${notified} price drop alert(s)`);
    } catch (err) {
      this.logger.error(`[CRON] Error running price drop alerts: ${(err as Error).message}`);
    }
  }

  /**
   * Auto-purge old notifications to keep the database lean.
   * Strategy: delete READ notifications older than 30 days, UNREAD older than 60 days.
   * Runs daily at 03:00 UTC (low-traffic window).
   */
  @Cron('0 3 * * *')
  async purgeOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const [readResult, unreadResult] = await Promise.all([
        // Delete read notifications older than 30 days
        this.notificationsRepo
          .createQueryBuilder()
          .delete()
          .where('is_read = :read AND created_at < :cutoff', { read: true, cutoff: thirtyDaysAgo })
          .execute(),
        // Delete unread notifications older than 60 days (they will never be acted on)
        this.notificationsRepo
          .createQueryBuilder()
          .delete()
          .where('is_read = :read AND created_at < :cutoff', { read: false, cutoff: sixtyDaysAgo })
          .execute(),
      ]);

      const total = (readResult.affected ?? 0) + (unreadResult.affected ?? 0);
      if (total > 0) {
        this.logger.log(`[CRON] Purged ${total} old notifications (${readResult.affected} read, ${unreadResult.affected} unread)`);
      }
    } catch (err) {
      this.logger.error(`[CRON] Error purging old notifications: ${(err as Error).message}`);
    }
  }

  /** H9: Alert hosts whose response rate dropped below 90% — runs daily at 08:00 */
  @Cron('0 8 * * *')
  async alertLowResponseRate(): Promise<void> {
    try {
      const hosts: Array<{ id: number; response_rate: number; first_name: string }> =
        await this.usersRepo.query(
          `SELECT u.id, u.response_rate, u.first_name
           FROM users u
           INNER JOIN properties p ON p.host_id = u.id AND p.status = 'published'
           WHERE u.response_rate < 90
           GROUP BY u.id`,
        );
      if (!hosts.length) return;

      await Promise.allSettled(
        hosts.map((h) =>
          this.notificationsService.create(
            h.id,
            'response_rate_warning',
            'Your response rate is low',
            'معدل استجابتك منخفض',
            `Your response rate is ${h.response_rate}%. Responding within 24h helps you get more bookings.`,
            `معدل استجابتك ${h.response_rate}%. الرد خلال 24 ساعة يساعدك في الحصول على المزيد من الحجوزات.`,
            { responseRate: h.response_rate },
          ),
        ),
      );
      this.logger.log(`[CRON] Alerted ${hosts.length} host(s) about low response rate`);
    } catch (err) {
      this.logger.error(`[CRON] Error alerting low response rate: ${(err as Error).message}`);
    }
  }

  /** HW7: Send monthly earnings summary email — runs 1st of each month at 09:00 */
  @Cron('0 9 1 * *')
  async sendMonthlyEarningsSummary(): Promise<void> {
    try {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const monthLabel = prevMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

      // Get all hosts who had earnings last month
      const rows: Array<{
        host_id: number;
        email: string;
        first_name: string;
        total_earnings: string;
        total_paid: string;
        total_pending: string;
        booking_count: string;
      }> = await this.earningsRepo.query(
        `SELECT
           e.host_id,
           u.email,
           u.first_name,
           CAST(SUM(e.amount) AS CHAR) AS total_earnings,
           CAST(SUM(CASE WHEN e.status = 'paid' THEN e.amount ELSE 0 END) AS CHAR) AS total_paid,
           CAST(SUM(CASE WHEN e.status != 'paid' THEN e.amount ELSE 0 END) AS CHAR) AS total_pending,
           CAST(COUNT(DISTINCT e.booking_id) AS CHAR) AS booking_count
         FROM earnings e
         INNER JOIN users u ON u.id = e.host_id
         WHERE e.created_at BETWEEN ? AND ?
         GROUP BY e.host_id`,
        [prevMonth.toISOString(), monthEnd.toISOString()],
      );

      if (!rows.length) {
        this.logger.log('[CRON] No host earnings for last month — skipping summary emails');
        return;
      }

      const feUrl = (process.env.FRONTEND_URL?.split(',')?.[0]?.trim()) ?? 'https://oikivo.com';
      const earningsUrl = `${feUrl}/hosting/earnings`;

      await Promise.allSettled(
        rows.map((r) =>
          this.mail.send(
            r.email,
            `Your ${monthLabel} Earnings Summary — Oikivo`,
            tplMonthlyEarningsSummary(
              r.first_name,
              monthLabel,
              r.total_earnings,
              'EGP',
              Number(r.booking_count),
              r.total_paid,
              r.total_pending,
              earningsUrl,
            ),
          ),
        ),
      );

      this.logger.log(`[CRON] Sent monthly earnings summary to ${rows.length} host(s)`);
    } catch (err) {
      this.logger.error(`[CRON] Error sending monthly earnings summary: ${(err as Error).message}`);
    }
  }


  /**
   * Issue #2 � Every hour at :20: handle confirmed bookings that still have
   * paymentStatus = 'pending':
   *   a) Send a payment reminder email 4 h after confirmedAt (sent once per booking)
   *   b) Auto-cancel bookings that remain unpaid 24 h after confirmedAt
   */
  @Cron('20 * * * *')
  async handleUnpaidConfirmedBookings(): Promise<void> {
    await this.sendPaymentReminders();
    await this.autoCancelExpiredPayments();
  }

  private async sendPaymentReminders(): Promise<void> {
    try {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

      const bookings = await this.bookingsRepo
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.guest', 'guest')
        .leftJoinAndSelect('b.property', 'property')
        .where('b.status = :status', { status: 'confirmed' })
        .andWhere('b.payment_status = :ps', { ps: 'pending' })
        .andWhere('b.confirmed_at <= :fourHoursAgo', { fourHoursAgo })
        .andWhere('b.confirmed_at > :fiveHoursAgo', { fiveHoursAgo })
        .andWhere('b.payment_reminder_sent_at IS NULL')
        .getMany();

      if (!bookings.length) return;

      for (const booking of bookings) {
        try {
          const feBase = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:3000';
          const tripsUrl = `${feBase.replace(/\/+$/, '')}/en/trips`;

          if (booking.guest?.email) {
            await this.mail.send(
              booking.guest.email,
              'Reminder: complete your payment to keep your booking � Oikivo',
              tplPaymentReminder(
                booking.guest.firstName,
                booking.property?.title ?? 'your stay',
                booking.checkIn,
                `#${booking.id}`,
                Number(booking.totalAmount).toFixed(2),
                booking.currency ?? 'EGP',
                tripsUrl,
              ),
            );
          }

          await this.bookingsRepo.update(booking.id, { paymentReminderSentAt: now } as any);

          await this.notificationsService.create(
            booking.guestId,
            'payment_reminder',
            'Payment Reminder',
            '????? ??????',
            `Your booking #${booking.id} is awaiting payment. Complete payment within 20 hours to keep your booking.`,
            `???? #${booking.id} ????? ?????. ???? ????? ???? 20 ???? ?????? ??? ????.`,
            { bookingId: booking.id },
          );
        } catch (e) {
          this.logger.warn(`[CRON] Failed to send payment reminder for booking #${booking.id}: ${(e as Error).message}`);
        }
      }

      this.logger.log(`[CRON] Sent ${bookings.length} payment reminder(s)`);
    } catch (err) {
      this.logger.error(`[CRON] Error sending payment reminders: ${(err as Error).message}`);
    }
  }

  private async autoCancelExpiredPayments(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const expired = await this.bookingsRepo
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.guest', 'guest')
        .leftJoinAndSelect('b.host', 'host')
        .leftJoinAndSelect('b.property', 'property')
        .where('b.status = :status', { status: 'confirmed' })
        .andWhere('b.payment_status = :ps', { ps: 'pending' })
        .andWhere('b.confirmed_at <= :cutoff', { cutoff })
        .getMany();

      if (!expired.length) return;

      for (const booking of expired) {
        try {
          await this.bookingsRepo.update(booking.id, {
            status: 'cancelled' as any,
            cancelledBy: 'system' as any,
            cancelledAt: new Date(),
            cancellationReason: 'Auto-cancelled: payment not received within 24 hours of booking confirmation.',
          });

          await this.notificationsService.create(
            booking.guestId,
            'booking_cancelled',
            'Booking Cancelled � Payment Not Received',
            '?? ????? ????? � ?? ?????? ?????',
            `Your booking #${booking.id} at ${booking.property?.title ?? 'the property'} was automatically cancelled because payment was not received within 24 hours.`,
            `?? ????? ???? #${booking.id} ???????? ??? ????? ?? ?????? ???? 24 ????.`,
            { bookingId: booking.id },
          );

          if (booking.hostId) {
            await this.notificationsService.create(
              booking.hostId,
              'booking_cancelled',
              'Booking Auto-Cancelled',
              '?? ????? ????? ????????',
              `Booking #${booking.id} from ${booking.guest?.firstName ?? 'a guest'} was auto-cancelled: guest did not complete payment within 24 hours.`,
              `?? ????? ????? #${booking.id} ????????: ?? ???? ????? ????? ???? 24 ????.`,
              { bookingId: booking.id },
            );
          }

          if (booking.guest?.email) {
            const feBase = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:3000';
            const tripsUrl = `${feBase.replace(/\/+$/, '')}/en/trips`;
            await this.mail.send(
              booking.guest.email,
              'Your booking has been cancelled � Oikivo',
              tplBookingCancelled(
                booking.guest.firstName,
                'guest',
                booking.property?.title ?? 'Property',
                booking.checkIn,
                booking.checkOut,
                `#${booking.id}`,
              ),
            ).catch(() => {});
          }

          this.logger.log(`[CRON] Auto-cancelled booking #${booking.id} (unpaid after 24h)`);
        } catch (e) {
          this.logger.warn(`[CRON] Failed to auto-cancel booking #${booking.id}: ${(e as Error).message}`);
        }
      }

      this.logger.log(`[CRON] Auto-cancelled ${expired.length} unpaid booking(s) after 24h`);
    } catch (err) {
      this.logger.error(`[CRON] Error auto-cancelling expired payments: ${(err as Error).message}`);
    }
  }

  /**
   * Issue #5 � Reconciliation: every 6 hours, find stay bookings that are paid
   * but have no EarningEntity and create the missing record.
   */
  @Cron('30 */6 * * *')
  async reconcileEarnings(): Promise<void> {
    try {
      const bookings = await this.bookingsRepo
        .createQueryBuilder('b')
        .leftJoin('earnings', 'e', 'e.booking_id = b.id')
        .where('b.status IN (:...statuses)', { statuses: ['confirmed', 'in_progress', 'completed'] })
        .andWhere('b.payment_status = :ps', { ps: 'paid' })
        .andWhere('e.id IS NULL')
        .select([
          'b.id AS b_id',
          'b.host_id AS b_host_id',
          'b.total_amount AS b_total_amount',
          'b.base_amount AS b_base_amount',
          'b.cleaning_fee AS b_cleaning_fee',
          'b.service_fee AS b_service_fee',
          'b.currency AS b_currency',
          'b.check_out AS b_check_out',
        ])
        .getRawMany<{
          b_id: number;
          b_host_id: number;
          b_total_amount: string;
          b_base_amount: string;
          b_cleaning_fee: string;
          b_service_fee: string;
          b_currency: string;
          b_check_out: string;
        }>();

      if (!bookings.length) return;

      let created = 0;
      for (const row of bookings) {
        try {
          const serviceFee = parseFloat(row.b_service_fee);
          const baseAmt = parseFloat(row.b_base_amount ?? row.b_total_amount);
          const cleaningFee = parseFloat(row.b_cleaning_fee ?? '0');
          const checkOutDate = new Date(row.b_check_out);
          const availableAt = new Date(checkOutDate);
          availableAt.setDate(availableAt.getDate() + 1);
          const now = new Date();

          await this.earningsRepo.save(
            this.earningsRepo.create({
              hostId: row.b_host_id,
              bookingId: row.b_id,
              amount: parseFloat((baseAmt + cleaningFee).toFixed(2)),
              platformFee: serviceFee,
              currency: row.b_currency ?? 'EGP',
              status: now >= availableAt ? 'available' : 'pending',
              availableAt,
            }),
          );
          created++;
        } catch (e) {
          this.logger.warn(`[CRON] Reconcile: failed to create earning for booking #${row.b_id}: ${(e as Error).message}`);
        }
      }

      if (created > 0) {
        this.logger.log(`[CRON] Reconciled ${created} missing earning record(s)`);
      }
    } catch (err) {
      this.logger.error(`[CRON] Error reconciling earnings: ${(err as Error).message}`);
    }
  }

  /**
   * FIX A1: Auto-decline pending bookings that the host hasn't responded to within 48 hours.
   * Prevents permanent calendar lockout from stale pending bookings.
   */
  private async autoDeclineStalePendingBookings(): Promise<void> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
    try {
      const stale = await this.bookingsRepo.find({
        where: {
          status: 'pending' as any,
          createdAt: LessThan(cutoff),
        },
        relations: ['guest', 'property'],
      });

      if (stale.length === 0) return;

      for (const booking of stale) {
        await this.bookingsRepo.update(booking.id, {
          status: 'declined',
          cancelledBy: 'system',
          cancelledAt: new Date(),
          cancellationReason: 'Auto-declined: host did not respond within 48 hours.',
        } as any);

        // Unblock dates so they become available for new bookings
        const ci = new Date(booking.checkIn);
        const co = new Date(booking.checkOut);
        for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
          await this.availabilityRepo.update(
            { propertyId: booking.propertyId, date: localDateStr(d) },
            { isBlocked: false },
          ).catch(() => {});
        }

        // Notify guest
        if (booking.guest) {
          await this.notificationsService.create(
            booking.guest.id,
            'booking',
            'Booking request not accepted',
            'طلب الحجز لم يتم قبوله',
            `Your booking request for ${booking.property?.title ?? 'a property'} was not accepted by the host within the required time.`,
            `لم يتم قبول طلب حجزك لـ ${booking.property?.title ?? 'عقار'} من قبل المضيف خلال الوقت المطلوب.`,
            { bookingId: booking.id },
          ).catch(() => {});
        }

        this.logger.log(`[CRON] Auto-declined stale pending booking #${booking.id} (created ${booking.createdAt})`);
      }

      this.logger.log(`[CRON] Auto-declined ${stale.length} stale pending booking(s)`);
    } catch (err) {
      this.logger.error(`[CRON] Error auto-declining stale pending bookings: ${(err as Error).message}`);
    }
  }

  // ─── Purge jobs (replaces MySQL scheduled events) ────────────────────────

  /** Purge expired & unused password reset tokens — runs every hour */
  @Cron('20 * * * *')
  async purgeExpiredPasswordResets(): Promise<void> {
    try {
      const result = await this.passwordResetsRepo
        .createQueryBuilder()
        .delete()
        .where('expires_at < NOW()')
        .andWhere('used_at IS NULL')
        .execute();
      if (result.affected && result.affected > 0) {
        this.logger.log(`[CRON] Purged ${result.affected} expired password reset(s)`);
      }
    } catch (err) {
      this.logger.error(`[CRON] Error purging expired password resets: ${(err as Error).message}`);
    }
  }

  /** Purge expired & unused verification tokens — runs every hour */
  @Cron('25 * * * *')
  async purgeExpiredVerificationTokens(): Promise<void> {
    try {
      const result = await this.verificationTokensRepo
        .createQueryBuilder()
        .delete()
        .where('expires_at < NOW()')
        .andWhere('used_at IS NULL')
        .execute();
      if (result.affected && result.affected > 0) {
        this.logger.log(`[CRON] Purged ${result.affected} expired verification token(s)`);
      }
    } catch (err) {
      this.logger.error(`[CRON] Error purging expired verification tokens: ${(err as Error).message}`);
    }
  }

  /**
   * BE-05 — Daily at 09:00 UTC: find users whose ID verification has been
   * pending for more than 48 hours and remind all admins to review them.
   */
  @Cron('0 9 * * *')
  async remindAdminsOfPendingIdVerifications(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const pendingUsers = await this.usersRepo.find({
        where: { idVerificationStatus: 'pending', updatedAt: LessThan(cutoff) },
        select: ['id', 'firstName', 'lastName', 'email'],
      });

      if (!pendingUsers.length) return;

      const admins = await this.usersRepo.find({
        where: { isAdmin: true, isActive: true },
        select: ['id', 'email'],
      });

      if (!admins.length) return;

      const count = pendingUsers.length;
      this.logger.warn(`[CRON] ${count} ID verification(s) pending > 48h — notifying ${admins.length} admin(s)`);

      await Promise.allSettled([
        // In-app notification for each admin
        ...admins.map((admin) =>
          this.notificationsService.create(
            admin.id,
            'pending_id_review',
            `${count} ID Verification${count > 1 ? 's' : ''} Awaiting Review`,
            `${count} طلب${count > 1 ? 'ات' : ''} تحقق من الهوية في انتظار المراجعة`,
            `${count} user${count > 1 ? 's have' : ' has'} had an ID verification pending for more than 48 hours. Please review in the admin panel.`,
            `${count} مستخدم${count > 1 ? 'ون' : ''} لديهم طلب تحقق من الهوية معلق لأكثر من 48 ساعة. يرجى المراجعة في لوحة الإدارة.`,
            { pendingCount: count },
          ),
        ),
        // Email reminder to each admin
        ...admins.map((admin) =>
          admin.email
            ? this.mail.send(
                admin.email,
                `[Action Required] ${count} ID Verification${count > 1 ? 's' : ''} Pending > 48h — Oikivo`,
                `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="color:#4f46e5;">ID Verification Reminder</h2>
  <p>${count} user account${count > 1 ? 's have' : ' has'} had an ID document pending admin review for more than <strong>48 hours</strong>.</p>
  <p>Please log in to the admin panel and review the pending submissions to avoid blocking users from accessing host features.</p>
  <p style="font-size:13px;color:#64748b;">Automated reminder — sent daily at 09:00 UTC when pending verifications exceed the 48-hour threshold.</p>
</div>`,
              )
            : Promise.resolve(),
        ),
      ]);
    } catch (err) {
      this.logger.error(`[CRON] Error sending pending ID verification reminders: ${(err as Error).message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // UX-08 / P1-07 — Daily at 10:00 UTC: send review request to guests whose
  // booking completed yesterday and who have not yet left a review.
  // ---------------------------------------------------------------------------
  @Cron('0 10 * * *')
  async sendPostCheckoutReviewRequests(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    try {
      const bookings = await this.bookingsRepo.find({
        where: { status: 'completed', checkOut: yStr as any },
        relations: ['guest', 'property'],
      });
      if (!bookings.length) return;

      const feBase = process.env.FRONTEND_URL ?? 'https://oikivo.com';

      await Promise.allSettled(
        bookings.map(async (booking) => {
          // Skip if guest already left a review for this booking
          const existingReview = await this.reviewsRepo.findOne({
            where: { bookingId: booking.id, reviewerId: booking.guestId },
          });
          if (existingReview) return;

          const reviewUrl = `${feBase}/en/reviews/new?bookingId=${booking.id}`;

          await this.notificationsService.create(
            booking.guestId,
            'review_request',
            'How was your stay?',
            'كيف كانت إقامتك؟',
            `Tell us about your stay at ${booking.property?.title ?? 'your recent booking'}. Your review helps other guests!`,
            `أخبرنا عن إقامتك في ${booking.property?.title ?? 'حجزك الأخير'}. تقييمك يساعد المسافرين الآخرين!`,
            { bookingId: booking.id },
          );

          if (booking.guest?.email) {
            await this.mail.send(
              booking.guest.email,
              'How was your stay? Leave a review — Oikivo',
              tplReviewRequest(
                booking.guest.firstName,
                booking.property?.title ?? 'your booking',
                `#${booking.id}`,
                reviewUrl,
              ),
            ).catch((e: Error) => {
              this.logger.warn(`[CRON] Failed to send review request to ${booking.guest.email}: ${e.message}`);
            });
          }
        }),
      );

      this.logger.log(`[CRON] Review request emails queued for ${bookings.length} completed booking(s)`);
    } catch (err) {
      this.logger.error(`[CRON] Error sending post-checkout review requests: ${(err as Error).message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // WF-06 — Monthly on 1st at 03:00 UTC: Re-evaluate superhost status.
  // Criteria: ≥10 completed bookings, avg guest rating ≥ 4.8, host-cancelled < 3%.
  // ---------------------------------------------------------------------------
  @Cron('0 3 1 * *')
  async reEvaluateSuperhostStatus(): Promise<void> {
    try {
      // Find all users who have at least one booking as a host
      const hostIds: { hostId: number }[] = await this.bookingsRepo
        .createQueryBuilder('b')
        .select('DISTINCT b.host_id', 'hostId')
        .getRawMany();

      await Promise.allSettled(
        hostIds.map(async ({ hostId }) => {
          const totalCompleted = await this.bookingsRepo.count({
            where: { hostId, status: 'completed' },
          });

          if (totalCompleted < 10) {
            await this.usersRepo.update(hostId, { isSuperhost: false });
            return;
          }

          const hostCancelled = await this.bookingsRepo.count({
            where: { hostId, status: 'cancelled', cancelledBy: 'host' as any },
          });
          const cancelRate = hostCancelled / (totalCompleted + hostCancelled);
          if (cancelRate >= 0.03) {
            await this.usersRepo.update(hostId, { isSuperhost: false });
            return;
          }

          const avgRatingResult = await this.reviewsRepo
            .createQueryBuilder('r')
            .select('AVG(r.overall_rating)', 'avg')
            .innerJoin(BookingEntity, 'b', 'b.id = r.booking_id')
            .where('b.host_id = :hostId', { hostId })
            .getRawOne<{ avg: string }>();

          const avgRating = parseFloat(avgRatingResult?.avg ?? '0');
          await this.usersRepo.update(hostId, { isSuperhost: avgRating >= 4.8 });
        }),
      );

      this.logger.log('[CRON] Superhost status re-evaluation complete');
    } catch (err) {
      this.logger.error(`[CRON] Error re-evaluating superhost status: ${(err as Error).message}`);
    }
  }
}
