import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { ConsultantEarningEntity } from '../entities/consultant-earning.entity';
import { MailService, tplConsultationReminder } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

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
   * Releases consultation earnings from 'hold' → 'paid' once 48 hours
   * have elapsed since the session was completed.
   */
  @Cron('*/30 * * * *')
  async releaseConsultationEarningsHold() {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const held = await this.bookingRepo.find({
      where: {
        paymentStatus: 'hold' as any,
        completedAt: LessThan(cutoff),
      },
    });

    if (held.length === 0) return;

    for (const booking of held) {
      booking.paymentStatus = 'paid' as any;
      await this.bookingRepo.save(booking);
    }

    this.logger.log(`Released earnings hold for ${held.length} consultation booking(s)`);

    // C12: Also release ConsultantEarningEntity records from 'hold' → 'available'
    const now = new Date();
    const heldEarnings = await this.earningRepo
      .createQueryBuilder('e')
      .where('e.status = :s', { s: 'hold' })
      .andWhere('e.available_at <= :now', { now })
      .getMany();
    for (const e of heldEarnings) {
      e.status = 'available';
      await this.earningRepo.save(e);
    }
    if (heldEarnings.length > 0) {
      this.logger.log(`Released ${heldEarnings.length} consultant earning(s) from hold to available`);
    }
  }
}
