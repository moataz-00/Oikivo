import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual, Between } from 'typeorm';
import { BookingEntity } from '../entities/booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { PropertyEntity } from '../entities/property.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { DisputeEntity } from '../entities/dispute.entity';
import { WishlistItemEntity } from '../entities/wishlist-item.entity';
import { SavedSearchEntity } from '../entities/saved-search.entity';
import { UserEntity } from '../entities/user.entity';
import { PriceAlertEntity } from '../entities/price-alert.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplInstapayPaymentDeclined, tplPreArrivalReminder, tplMonthlyEarningsSummary, tplBookingAccepted, tplPaymentReminder, tplBookingCancelled } from '../mail/mail.service';
import { PayoutsService } from '../payouts/payouts.service';

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
    const todayStr = today.toISOString().split('T')[0];

    await this.transitionToInProgress(todayStr);
    await this.autoCompleteBookings(todayStr);
    await this.releaseEarnings();
    await this.runAutoPayouts();
    await this.sendPreArrivalReminders(todayStr); // FIX BUG-GL1
    await this.purgeExpiredArchivedListings();
  }

  // Run every 30 minutes to release held deposits promptly after 48h deadline.
  @Cron('*/30 * * * *')
  async runDepositReleaseJob(): Promise<void> {
    await this.autoReleaseExpiredDeposits();
  }

  /** a) confirmed → in_progress when checkIn <= today */
  private async transitionToInProgress(todayStr: string): Promise<void> {
    try {
      const bookings = await this.bookingsRepo.find({
        where: { status: 'confirmed', checkIn: LessThanOrEqual(todayStr) },
      });

      if (bookings.length === 0) return;

      await this.bookingsRepo.update(
        bookings.map((b) => b.id),
        { status: 'in_progress' },
      );

      this.logger.log(`[CRON] ${bookings.length} booking(s) transitioned to in_progress`);
    } catch (err) {
      this.logger.error(`[CRON] Error transitioning bookings to in_progress: ${(err as Error).message}`);
    }
  }

  /** b) in_progress → completed when checkOut < today */
  private async autoCompleteBookings(todayStr: string): Promise<void> {
    try {
      const bookings = await this.bookingsRepo.find({
        where: { status: 'in_progress', checkOut: LessThan(todayStr) },
        relations: ['property', 'guest'],
      });

      if (bookings.length === 0) return;

      await this.bookingsRepo.update(
        bookings.map((b) => b.id),
        { status: 'completed', paymentStatus: 'paid' },
      );

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

      this.logger.log(`[CRON] ${bookings.length} booking(s) auto-completed`);
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
      const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      const oneDayStr = oneDayFromNow.toISOString().split('T')[0];

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
   * state for more than 48 hours without admin action.
   */
  @Cron('0 * * * *')
  async autoDeclineStaleInstapaySubmissions(): Promise<void> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
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
      await this.bookingsRepo
        .createQueryBuilder()
        .update(BookingEntity)
        .set({ paymentStatus: 'declined', paymentNote: 'Auto-declined: no admin action within 48 hours' } as any)
        .whereInIds(ids)
        .execute();

      this.logger.log(`[CRON] ${stale.length} stale InstaPay submission(s) auto-declined`);

      // Notify each guest and send email (best-effort)
      await Promise.allSettled(
        stale.map(async (booking) => {
          await this.notificationsService.create(
            booking.guestId,
            'payment_declined',
            'Payment Could Not Be Verified',
            'تعذّر التحقق من الدفع',
            `Your InstaPay payment for booking #${booking.id} could not be verified within 48 hours. Please go to My Trips and retry.`,
            `تعذّر التحقق من دفعك للحجز #${booking.id} خلال 48 ساعة. يرجى الانتقال إلى رحلاتي والمحاولة مرة أخرى.`,
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
                'No admin response within 48 hours. Please retry.',
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

      const expired = await this.propertiesRepo
        .createQueryBuilder('p')
        .where('p.status = :status', { status: 'archived' })
        .andWhere('p.archivedAt IS NOT NULL')
        .andWhere('p.archivedAt <= :cutoff', { cutoff })
        .getMany();

      if (!expired.length) return;

      await this.propertiesRepo.remove(expired);
      this.logger.log(`[CRON] ${expired.length} expired archived listing(s) purged`);
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
          'b.service_fee AS b_service_fee',
          'b.currency AS b_currency',
          'b.check_out AS b_check_out',
        ])
        .getRawMany<{
          b_id: number;
          b_host_id: number;
          b_total_amount: string;
          b_service_fee: string;
          b_currency: string;
          b_check_out: string;
        }>();

      if (!bookings.length) return;

      let created = 0;
      for (const row of bookings) {
        try {
          const totalAmount = parseFloat(row.b_total_amount);
          const serviceFee = parseFloat(row.b_service_fee);
          const checkOutDate = new Date(row.b_check_out);
          const availableAt = new Date(checkOutDate);
          availableAt.setDate(availableAt.getDate() + 1);
          const now = new Date();

          await this.earningsRepo.save(
            this.earningsRepo.create({
              hostId: row.b_host_id,
              bookingId: row.b_id,
              amount: parseFloat((totalAmount - serviceFee).toFixed(2)),
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
}
