import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import Stripe from 'stripe';
import { ExperienceBookingEntity } from '../entities/experience-booking.entity';
import { ExperienceEntity } from '../entities/experience.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplRefundNotification } from '../mail/mail.service';
import { ExperiencesService } from './experiences.service';
import { CreateExperienceBookingDto } from './dto/create-experience-booking.dto';

@Injectable()
export class ExperienceBookingsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(ExperienceBookingsService.name);

  constructor(
    @InjectRepository(ExperienceBookingEntity)
    private bookingsRepo: Repository<ExperienceBookingEntity>,
    @InjectRepository(ExperienceEntity)
    private experiencesRepo: Repository<ExperienceEntity>,
    private experiencesService: ExperiencesService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private mail: MailService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey ?? 'sk_test_placeholder', {
      apiVersion: '2024-04-10' as any,
    });
  }

  async create(guestId: number, dto: CreateExperienceBookingDto): Promise<ExperienceBookingEntity> {
    const experience = await this.experiencesRepo.findOne({
      where: { id: dto.experienceId, status: 'published' },
      relations: ['host', 'schedule'],
    });
    if (!experience) throw new NotFoundException('Experience not found or not available');
    if (experience.hostId === guestId) {
      throw new ForbiddenException('You cannot book your own experience');
    }

    // Validate booking date is in the future
    const bookingDate = new Date(dto.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // Validate guest count
    if (dto.guestsCount < experience.minGuests) {
      throw new BadRequestException(`Minimum ${experience.minGuests} guests required`);
    }
    if (dto.guestsCount > experience.maxGuests) {
      throw new BadRequestException(`Maximum ${experience.maxGuests} guests allowed`);
    }

    // Validate the schedule slot exists for that day
    const dayOfWeek = bookingDate.getDay();
    const validSlot = experience.schedule.find(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive && s.startTime === dto.startTime,
    );
    if (!validSlot && experience.schedule.length > 0) {
      throw new BadRequestException('No available time slot for the selected date and time');
    }

    // Check existing bookings for capacity on that date/time
    const existingBookings = await this.bookingsRepo
      .createQueryBuilder('booking')
      .select('SUM(booking.guestsCount)', 'totalGuests')
      .where('booking.experienceId = :experienceId', { experienceId: dto.experienceId })
      .andWhere('booking.bookingDate = :bookingDate', { bookingDate: dto.bookingDate })
      .andWhere('booking.startTime = :startTime', { startTime: dto.startTime })
      .andWhere('booking.status IN (:...statuses)', { statuses: ['pending', 'confirmed'] })
      .getRawOne();

    const bookedGuests = parseInt(existingBookings?.totalGuests) || 0;
    if (bookedGuests + dto.guestsCount > experience.maxGuests) {
      const remaining = experience.maxGuests - bookedGuests;
      throw new BadRequestException(
        remaining > 0
          ? `Only ${remaining} spots remaining for this time slot`
          : 'This time slot is fully booked',
      );
    }

    // Calculate pricing
    const pricing = this.experiencesService.calculatePrice(experience, dto.guestsCount);

    const booking = this.bookingsRepo.create({
      experienceId: dto.experienceId,
      guestId,
      hostId: experience.hostId,
      bookingDate: dto.bookingDate,
      startTime: dto.startTime,
      guestsCount: dto.guestsCount,
      pricePerPerson: pricing.pricePerPerson,
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      serviceFee: pricing.serviceFee,
      totalAmount: pricing.totalAmount,
      guestNote: dto.guestNote,
      status: experience.instantBook ? 'confirmed' : 'pending',
    });

    const saved = await this.bookingsRepo.save(booking);

    // Increment total bookings
    await this.experiencesRepo.increment({ id: dto.experienceId }, 'totalBookings', 1);

    // Notify host
    await this.notificationsService.create(
      experience.hostId,
      'experience_booking',
      'New Experience Booking',
      'حجز تجربة جديد',
      `New booking for "${experience.title}" on ${dto.bookingDate}`,
      `حجز جديد لتجربة "${experience.title}" في ${dto.bookingDate}`,
      { bookingId: saved.id, experienceId: dto.experienceId },
    );

    return this.findOne(saved.id);
  }

  async findOne(id: number): Promise<ExperienceBookingEntity> {
    const booking = await this.bookingsRepo.findOne({
      where: { id },
      relations: ['experience', 'experience.photos', 'guest', 'host', 'review'],
    });
    if (!booking) throw new NotFoundException('Experience booking not found');
    return booking;
  }

  async getGuestBookings(guestId: number, status?: string) {
    const where: any = { guestId };
    if (status) where.status = status;

    return this.bookingsRepo.find({
      where,
      relations: ['experience', 'experience.photos', 'host'],
      order: { bookingDate: 'DESC' },
    });
  }

  async getHostBookings(hostId: number, status?: string) {
    if (status === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      return this.bookingsRepo.find({
        where: { hostId, status: In(['confirmed', 'pending']), bookingDate: MoreThanOrEqual(today) },
        relations: ['experience', 'experience.photos', 'guest'],
        order: { bookingDate: 'ASC' },
      });
    }

    const where: any = { hostId };
    if (status) where.status = status;

    return this.bookingsRepo.find({
      where,
      relations: ['experience', 'experience.photos', 'guest'],
      order: { bookingDate: 'DESC' },
    });
  }

  async getHostAnalytics(hostId: number) {
    const all = await this.bookingsRepo.find({
      where: { hostId },
      relations: ['experience'],
      order: { createdAt: 'DESC' },
    });

    const byStatus: Record<string, number> = {
      pending: 0, confirmed: 0, completed: 0, cancelled: 0, declined: 0,
    };
    let totalRevenue = 0;
    let totalGuests = 0;

    for (const b of all) {
      byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
      if (b.status === 'completed' || b.status === 'confirmed') {
        // Host earns their price (subtotal) - we take the service fee from the guest
        totalRevenue += Number(b.subtotal ?? 0);
        totalGuests += Number(b.guestsCount ?? 1);
      }
    }

    // Monthly breakdown (last 12 months)
    const now = new Date();
    const monthlyMap: Record<string, { bookings: number; revenue: number; guests: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { bookings: 0, revenue: 0, guests: 0 };
    }

    for (const b of all) {
      const key = b.createdAt
        ? `${new Date(b.createdAt).getFullYear()}-${String(new Date(b.createdAt).getMonth() + 1).padStart(2, '0')}`
        : null;
      if (key && monthlyMap[key] && (b.status === 'completed' || b.status === 'confirmed')) {
        monthlyMap[key].bookings += 1;
        monthlyMap[key].revenue += Number(b.subtotal ?? 0);
        monthlyMap[key].guests += Number(b.guestsCount ?? 1);
      }
    }

    const monthlyBreakdown = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }));

    // Top experiences by bookings
    const expMap: Record<number, { title: string; bookings: number; revenue: number; guests: number }> = {};
    for (const b of all) {
      if (b.status === 'completed' || b.status === 'confirmed') {
        if (!expMap[b.experienceId]) {
          expMap[b.experienceId] = { title: b.experience?.title ?? `Experience #${b.experienceId}`, bookings: 0, revenue: 0, guests: 0 };
        }
        expMap[b.experienceId].bookings += 1;
        expMap[b.experienceId].revenue += Number(b.subtotal ?? 0);
        expMap[b.experienceId].guests += Number(b.guestsCount ?? 1);
      }
    }

    const topExperiences = Object.values(expMap)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    return {
      totalBookings: all.length,
      byStatus,
      totalRevenue,
      totalGuests,
      avgBookingValue: all.length > 0 ? parseFloat((totalRevenue / Math.max(1, byStatus.completed + byStatus.confirmed)).toFixed(2)) : 0,
      monthlyBreakdown,
      topExperiences,
    };
  }

  async confirm(id: number, hostId: number): Promise<ExperienceBookingEntity> {
    const booking = await this.findOne(id);
    if (booking.hostId !== hostId) {
      throw new ForbiddenException('Not authorized');
    }
    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not pending');
    }
    booking.status = 'confirmed';
    const saved = await this.bookingsRepo.save(booking);

    await this.notificationsService.create(
      booking.guestId,
      'experience_confirmed',
      'Experience Booking Confirmed',
      'تم تأكيد حجز التجربة',
      `Your booking for "${booking.experience.title}" has been confirmed`,
      `تم تأكيد حجزك لتجربة "${booking.experience.title}"`,
      { bookingId: id },
    );

    return saved;
  }

  async decline(id: number, hostId: number, reason?: string): Promise<ExperienceBookingEntity> {
    const booking = await this.findOne(id);
    if (booking.hostId !== hostId) {
      throw new ForbiddenException('Not authorized');
    }
    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not pending');
    }
    booking.status = 'declined';
    booking.cancellationReason = reason || null;
    const saved = await this.bookingsRepo.save(booking);

    await this.notificationsService.create(
      booking.guestId,
      'experience_declined',
      'Experience Booking Declined',
      'تم رفض حجز التجربة',
      `Your booking for "${booking.experience.title}" was declined`,
      `تم رفض حجزك لتجربة "${booking.experience.title}"`,
      { bookingId: id },
    );

    return saved;
  }

  async cancel(id: number, userId: number, reason?: string): Promise<ExperienceBookingEntity> {
    const booking = await this.findOne(id);
    if (booking.guestId !== userId && booking.hostId !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const cancelledBy = booking.guestId === userId ? 'guest' : 'host';

    // Guests cannot cancel after the experience booking date has started
    if (cancelledBy === 'guest') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(booking.bookingDate);
      bookingDate.setHours(0, 0, 0, 0);
      if (today >= bookingDate) {
        throw new BadRequestException('Cancellations are not allowed on or after the experience date');
      }
    }

    // If paid via Stripe, trigger automatic full refund
    let stripeRefundTriggered = false;
    if (booking.stripePaymentIntentId && booking.paymentStatus === 'paid') {
      try {
        await this.stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          // No amount = full refund
        });
        stripeRefundTriggered = true;
      } catch (err) {
        this.logger.error(`Stripe refund failed for experience booking #${id}: ${(err as Error).message}`);
      }
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || null;
    booking.cancelledAt = new Date();
    if (stripeRefundTriggered) {
      booking.paymentStatus = 'refunded';
    }
    const saved = await this.bookingsRepo.save(booking);

    // Notify the other party
    const notifyUserId = userId === booking.guestId ? booking.hostId : booking.guestId;
    await this.notificationsService.create(
      notifyUserId,
      'experience_cancelled',
      'Experience Booking Cancelled',
      'تم إلغاء حجز التجربة',
      `A booking for "${booking.experience.title}" has been cancelled`,
      `تم إلغاء حجز تجربة "${booking.experience.title}"`,
      { bookingId: id },
    );

    // Send Stripe refund email to guest if applicable
    if (stripeRefundTriggered && cancelledBy === 'guest') {
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
        await this.mail.send(
          booking.guest.email,
          'Your Stripe refund is being processed — Oikivo',
          tplRefundNotification(
            booking.guest.firstName,
            Number(booking.totalAmount).toFixed(2),
            'EGP',
            booking.experience.title,
            `#${id}`,
            new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
            'Credit / Debit Card',
            tripsUrl,
          ),
        );
      } catch (e) {
        this.logger.error(`Failed to send Stripe refund email for experience booking #${id}: ${(e as Error).message}`);
      }
    }

    return saved;
  }

  async complete(id: number, hostId: number): Promise<ExperienceBookingEntity> {
    const booking = await this.findOne(id);
    if (booking.hostId !== hostId) {
      throw new ForbiddenException('Not authorized');
    }
    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Booking must be confirmed to complete');
    }
    booking.status = 'completed';
    return this.bookingsRepo.save(booking);
  }

  async submitPayment(
    id: number,
    guestId: number,
    data: { method: string; reference: string; proofUrl?: string },
  ): Promise<ExperienceBookingEntity> {
    const booking = await this.findOne(id);
    if (booking.guestId !== guestId) {
      throw new ForbiddenException('Not authorized');
    }
    booking.paymentMethod = data.method;
    booking.paymentReference = data.reference;
    booking.paymentProofUrl = data.proofUrl ?? null;
    booking.paymentStatus = 'submitted';
    return this.bookingsRepo.save(booking);
  }

  async confirmPayment(id: number): Promise<ExperienceBookingEntity> {
    const booking = await this.findOne(id);
    booking.paymentStatus = 'paid';
    return this.bookingsRepo.save(booking);
  }
}
