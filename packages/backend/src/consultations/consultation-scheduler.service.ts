import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { ConsultantEarningEntity } from '../entities/consultant-earning.entity';
import { MailService, tplConsultationReminder, tplConsultationInstapayPending } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { ConsultationsService } from './consultations.service';

@Injectable()
export class ConsultationSchedulerService {
  private readonly logger = new Logger(ConsultationSchedulerService.name);

  constructor(
    @InjectRepository(ConsultationBookingEntity)
    private readonly bookingRepo: Repository<ConsultationBookingEntity>,
    @InjectRepository(ConsultantEarningEntity)
    private readonly earningRepo: Repository<ConsultantEarningEntity>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly consultationsService: ConsultationsService,
  ) {}

  /** Runs every day at 08:00 — sends 24h reminder to confirmed bookings due ~tomorrow. */
  @Cron('0 8 * * *')
  async sendDailyReminders() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000); // now + 20h
    const windowEnd   = new Date(now.getTime() + 28 * 60 * 60 * 1000); // now + 28h

    const bookings = await this.bookingRepo.find({
      where: {
        status: 'confirmed',
        scheduledAt: Between(windowStart, windowEnd),
      },
      relations: ['client', 'consultant', 'consultant.user'],
    });

    if (bookings.length === 0) return;

    const appUrl = this.configService.get<string>('APP_URL') ?? 'https://oikivo.com';

    for (const booking of bookings) {
      const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const durationMinutes = booking.durationMinutes ?? 60;
      const serviceName = `${durationMinutes} min Consultation`;
      const meetingLink: string | null = booking.meetingLink ?? null;

      const clientName = `${booking.client?.firstName ?? ''} ${booking.client?.lastName ?? ''}`.trim() || 'Client';
      const consultantDisplayName = booking.consultant?.displayName
        ?? `${booking.consultant?.user?.firstName ?? ''} ${booking.consultant?.user?.lastName ?? ''}`.trim()
        ?? 'Consultant';

      const sessionUrl = `${appUrl}/en/consultations/my-bookings`;

      // Send to client
      if (booking.client?.email) {
        try {
          await this.mailService.send(
            booking.client.email,
            '⏰ Reminder: Your consultation session is tomorrow',
            tplConsultationReminder(
              clientName,
              'client',
              consultantDisplayName,
              serviceName,
              scheduledLabel,
              durationMinutes,
              meetingLink,
              sessionUrl,
            ),
          );
        } catch (err) {
          this.logger.error(`Failed to send reminder to client ${booking.client.email}: ${err}`);
        }
      }

      // Send to consultant
      const consultantEmail = booking.consultant?.user?.email;
      if (consultantEmail) {
        try {
          await this.mailService.send(
            consultantEmail,
            '⏰ Reminder: Your consultation session is tomorrow',
            tplConsultationReminder(
              consultantDisplayName,
              'consultant',
              clientName,
              serviceName,
              scheduledLabel,
              durationMinutes,
              meetingLink,
              `${appUrl}/en/consultations/dashboard`,
            ),
          );
        } catch (err) {
          this.logger.error(`Failed to send reminder to consultant ${consultantEmail}: ${err}`);
        }
      }
    }

    this.logger.log(`Sent 24h reminders for ${bookings.length} bookings`);
  }

  /**
   * H16 — Runs every 30 minutes.
   * 1) Auto-confirms completed bookings where client didn't respond within 48h
   *    and creates their earning records.
   * 2) Releases consultation earnings from 'hold' → 'paid' once availableAt has passed.
   */
  @Cron('*/30 * * * *')
  async releaseConsultationEarningsHold() {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Step 1: Auto-confirm completed bookings where client hasn't confirmed in 48h
    const unconfirmed = await this.bookingRepo.find({
      where: {
        status: 'completed' as any,
        paymentStatus: 'hold' as any,
        completedAt: LessThan(cutoff),
        clientConfirmedAt: IsNull(),
      },
    });

    for (const booking of unconfirmed) {
      booking.clientConfirmedAt = new Date();
      booking.paymentStatus = 'paid' as any;
      await this.bookingRepo.save(booking);

      // Create earning if not exists
      const existing = await this.earningRepo.findOne({ where: { bookingId: booking.id } });
      if (!existing) {
        const availableAt = new Date();
        availableAt.setHours(availableAt.getHours() + 48);
        await this.earningRepo.save(
          this.earningRepo.create({
            consultantId: booking.consultantId,
            bookingId: booking.id,
            amount: Number(booking.consultantPayout),
            platformFee: Number(booking.platformFee),
            currency: booking.currency ?? 'EGP',
            status: 'hold',
            availableAt,
          }),
        );
      }
    }

    if (unconfirmed.length > 0) {
      this.logger.log(`Auto-confirmed ${unconfirmed.length} booking(s) after 48h client timeout`);
    }

    // Step 2: Release already-confirmed bookings that are still on hold
    const held = await this.bookingRepo.find({
      where: {
        status: 'completed' as any,
        paymentStatus: 'hold' as any,
        completedAt: LessThan(cutoff),
        clientConfirmedAt: LessThan(cutoff),
      },
    });

    for (const booking of held) {
      booking.paymentStatus = 'paid' as any;
      await this.bookingRepo.save(booking);
    }

    if (held.length > 0) {
      this.logger.log(`Released earnings hold for ${held.length} consultation booking(s)`);
    }

    // C12: Delegate to the guarded release flow that checks booking/payment states.
    await this.consultationsService.releaseConsultantEarningsHold();
  }

  /** P4 — Runs every 15 minutes: auto-cancel bookings where payment deadline has passed and no payment submitted */
  @Cron('*/15 * * * *')
  async cancelExpiredUnpaidBookings() {
    const now = new Date();
    const expired = await this.bookingRepo.find({
      where: {
        status: 'pending' as any,
        paymentStatus: 'pending' as any,
        paymentDeadline: Not(IsNull()),
      },
    });

    const toCancel = expired.filter(b => b.paymentDeadline && new Date(b.paymentDeadline) <= now);
    for (const booking of toCancel) {
      booking.status = 'cancelled' as any;
      booking.cancelledBy = 'admin' as any;
      booking.cancellationReason = 'Auto-cancelled: payment deadline expired';
      await this.bookingRepo.save(booking);
    }

    if (toCancel.length > 0) {
      this.logger.log(`[P4] Auto-cancelled ${toCancel.length} unpaid consultation booking(s) past payment deadline`);
    }
  }

  /** MISS5 — Runs every 15 minutes: send payment reminder ~1h after booking if still unpaid */
  @Cron('*/15 * * * *')
  async sendPaymentReminders() {
    // Find bookings that:
    // - are still pending payment
    // - have a payment deadline set
    // - were created more than 45 minutes ago (so reminder fires ~1h in)
    // - payment reminder hasn't been sent yet
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);

    const unpaid = await this.bookingRepo.find({
      where: {
        status: 'pending' as any,
        paymentStatus: 'pending' as any,
        paymentDeadline: Not(IsNull()),
        paymentReminderSent: false as any,
        createdAt: LessThan(cutoff),
      },
      relations: ['client', 'consultant'],
    });

    // Filter: only bookings whose deadline hasn't passed yet (still time to pay)
    const now = new Date();
    const eligible = unpaid.filter(b => b.paymentDeadline && new Date(b.paymentDeadline) > now);

    if (eligible.length === 0) return;

    const instapayPhone = this.configService.get<string>('INSTAPAY_PHONE') ?? '';
    const instapayName = this.configService.get<string>('INSTAPAY_NAME', 'Oikivo Platform');
    const appUrl = this.configService.get<string>('FRONTEND_URL')
      ?? this.configService.get<string>('APP_URL')
      ?? 'https://oikivo.com';

    for (const booking of eligible) {
      if (!booking.client?.email) continue;

      const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const bookingRef = `CONSULT-${booking.id}`;
      const sessionLabel = `${booking.durationMinutes ?? 60} min Consultation`;
      const consultantName = booking.consultant?.displayName ?? 'Consultant';

      try {
        await this.mailService.send(
          booking.client.email,
          '⏰ Payment reminder — Complete your InstaPay transfer',
          tplConsultationInstapayPending(
            booking.client.firstName ?? 'Client',
            consultantName,
            sessionLabel,
            scheduledLabel,
            Number(booking.price).toFixed(2),
            booking.currency ?? 'EGP',
            instapayPhone,
            instapayName,
            bookingRef,
            `${appUrl}/en/consultations/my-bookings`,
          ),
        );
      } catch (err) {
        this.logger.error(`Failed to send payment reminder to ${booking.client.email}: ${err}`);
      }

      // Mark reminder as sent
      booking.paymentReminderSent = true;
      await this.bookingRepo.save(booking);
    }

    this.logger.log(`[MISS5] Sent payment reminders for ${eligible.length} booking(s)`);
  }
}
