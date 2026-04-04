import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual, Between } from 'typeorm';
import { BookingEntity } from '../entities/booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { PropertyEntity } from '../entities/property.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { DisputeEntity } from '../entities/dispute.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplInstapayPaymentDeclined } from '../mail/mail.service';

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
    private notificationsService: NotificationsService,
    private mail: MailService,
  ) {}

  /**
   * 5.1 — Daily job at 02:00 UTC:
   *   a) Transition confirmed bookings whose check-in date has passed → in_progress
   *   b) Auto-complete in_progress bookings whose check-out date has passed
   *   c) Release pending earnings whose availableAt has passed → available
   */
  @Cron('0 2 * * *')
  async runDailyJobs(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    await this.transitionToInProgress(todayStr);
    await this.autoCompleteBookings(todayStr);
    await this.releaseEarnings();
    await this.purgeExpiredArchivedListings();
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
              'Payment could not be verified — Journey Stay',
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
}
