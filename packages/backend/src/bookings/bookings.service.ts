import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingEntity } from '../entities/booking.entity';
import { PropertyEntity } from '../entities/property.entity';
import { UserEntity } from '../entities/user.entity';
import { AvailabilityEntity } from '../entities/availability.entity';
import { EarningEntity } from '../entities/earning.entity';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplBookingRequestReceived, tplBookingRequestSubmitted, tplBookingConfirmed, tplBookingCancelled, tplInstapayPaymentConfirmed, tplInstapayPaymentDeclined, tplRefundNotification, tplInstapayRefundPending, tplInstapayRefundCompleted, tplHostCancelledRebooking } from '../mail/mail.service';
import { CoHostEntity } from '../entities/cohost.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaymentsService } from '../payments/payments.service';
import { AuditLogService } from '../audit-log/audit-log.service';

// ─── Egyptian public holiday data ────────────────────────────────────────────
// Fixed Gregorian dates [month (1-based), day]
const EG_FIXED_HOLIDAYS: [number, number][] = [
  [1, 7],   // Coptic Christmas
  [1, 25],  // Revolution Day / National Police Day
  [4, 25],  // Sinai Liberation Day
  [5, 1],   // Labour Day
  [6, 30],  // June 30 Revolution Day
  [7, 23],  // July 23 Revolution Day
  [10, 6],  // Armed Forces Day
];

// Approximate Gregorian dates for lunar Islamic holidays per year
const EG_ISLAMIC_HOLIDAYS: Record<number, [number, number][]> = {
  2025: [
    [3, 30], [3, 31], [4, 1], [4, 2],   // Eid al-Fitr
    [6, 6],  [6, 7],  [6, 8],           // Eid al-Adha
    [6, 27],                             // Islamic New Year
    [9, 4],                              // Mawlid (Prophet's Birthday)
  ],
  2026: [
    [3, 20], [3, 21], [3, 22],           // Eid al-Fitr
    [5, 27], [5, 28], [5, 29],           // Eid al-Adha
    [6, 17],                             // Islamic New Year
    [8, 25],                             // Mawlid
  ],
  2027: [
    [3, 9],  [3, 10], [3, 11],           // Eid al-Fitr
    [5, 16], [5, 17], [5, 18],           // Eid al-Adha
    [6, 6],                              // Islamic New Year
    [8, 14],                             // Mawlid
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class BookingsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    @InjectRepository(AvailabilityEntity)
    private availabilityRepo: Repository<AvailabilityEntity>,
    @InjectRepository(EarningEntity)
    private earningsRepo: Repository<EarningEntity>,
    @InjectRepository(CoHostEntity)
    private cohostsRepo: Repository<CoHostEntity>,
    private availabilityService: AvailabilityService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private mail: MailService,
    private paymentsService: PaymentsService,
    private auditLog: AuditLogService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey ?? 'sk_test_placeholder', {
      apiVersion: '2024-04-10' as any,
    });
  }

  /** Returns true when the date falls on an Egyptian public holiday. */
  private isEgyptianPublicHoliday(d: Date): boolean {
    const m = d.getMonth() + 1; // 1-based
    const day = d.getDate();
    if (EG_FIXED_HOLIDAYS.some(([hm, hd]) => hm === m && hd === day)) return true;
    const yr = d.getFullYear();
    const islamic = EG_ISLAMIC_HOLIDAYS[yr];
    if (islamic && islamic.some(([hm, hd]) => hm === m && hd === day)) return true;
    return false;
  }

  async create(guestId: number, dto: CreateBookingDto): Promise<BookingEntity> {
    // Idempotency: return existing booking if same guest/property/dates within 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existing = await this.bookingsRepo.findOne({
      where: {
        guestId,
        propertyId: dto.propertyId,
        checkIn: dto.checkIn,
        checkOut: dto.checkOut,
        createdAt: MoreThanOrEqual(fiveMinsAgo),
      },
    });
    if (existing) return this.findOne(existing.id);

    // Guest must have a verified email address before booking
    const guest = await this.usersRepo.findOne({ where: { id: guestId } });
    if (!guest || !guest.isEmailVerified) {
      throw new ForbiddenException('Please verify your email address before making a booking');
    }

    const property = await this.propertiesRepo.findOne({
      where: { id: dto.propertyId, status: 'published', isActive: true },
      relations: ['host'],
    });
    if (!property) throw new NotFoundException('Property not found or not available');
    if (property.hostId === guestId) {
      throw new ForbiddenException('You cannot book your own property');
    }

    // No listing-type validation needed (all listings are short-term)

    const checkInDate = new Date(dto.checkIn);
    const checkOutDate = new Date(dto.checkOut);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    if (checkOutDate <= checkInDate) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (nights < property.minNights) {
      throw new BadRequestException(`Minimum stay is ${property.minNights} nights`);
    }
    if (nights > property.maxNights) {
      throw new BadRequestException(`Maximum stay is ${property.maxNights} nights`);
    }
    if (dto.guestsCount > property.maxGuests) {
      throw new BadRequestException(`Maximum ${property.maxGuests} guests allowed`);
    }

    const available = await this.availabilityService.isAvailable(
      dto.propertyId,
      dto.checkIn,
      dto.checkOut,
    );
    if (!available) {
      throw new BadRequestException('Property is not available for the selected dates');
    }

    // Calculate price with weekend pricing and discounts
    const pricePerNight = Number(property.pricePerNight ?? 0);
    const weekendPrice =
      property.weekendPrice != null ? Number(property.weekendPrice) : null;

    let baseAmount = 0;
    // Sum per-night prices respecting weekend rates and Egyptian public holidays
    for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay(); // 5=Friday, 6=Saturday
      const isWeekend = dow === 5 || dow === 6;
      const isPeak = isWeekend || this.isEgyptianPublicHoliday(d);
      baseAmount += isPeak && weekendPrice != null ? weekendPrice : pricePerNight;
    }
    baseAmount = parseFloat(baseAmount.toFixed(2));

    // Apply long-stay discounts + new promotion discounts
    const weeklyDiscount = Number(property.weeklyDiscount ?? 0);
    const monthlyDiscount = Number(property.monthlyDiscount ?? 0);
    const newListingPromoEnabled = !!property.newListingPromotionEnabled;
    const lastMinutePct = Number(property.lastMinuteDiscountPercent ?? 0);
    const approvedCount = Number(property.approvedBookingsCount ?? 0);

    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    let discountPercent = 0;
    if (nights >= 28 && monthlyDiscount > 0) discountPercent = monthlyDiscount;
    else if (nights >= 7 && weeklyDiscount > 0) discountPercent = weeklyDiscount;
    else if (newListingPromoEnabled && approvedCount < 3) discountPercent = 20;
    else if (daysUntilCheckIn <= 14 && daysUntilCheckIn >= 0 && lastMinutePct > 0) discountPercent = lastMinutePct;

    if (discountPercent > 0) {
      const disc = parseFloat(((baseAmount * discountPercent) / 100).toFixed(2));
      baseAmount = parseFloat((baseAmount - disc).toFixed(2));
    }

    const bookingMode = property.bookingMode ?? 'instant_book';
    const effectiveInstantBook =
      property.instantBook ||
      bookingMode === 'instant_book' ||
      (bookingMode === 'approve_first_three' && approvedCount >= 3);

    const cleaningFee = Number(property.cleaningFee ?? 0);
    const depositAmount = Number(property.securityDeposit ?? 0);
    const serviceFee = parseFloat(
      ((baseAmount * Number(property.serviceFeePercent ?? 14)) / 100).toFixed(2),
    );
    const taxes = 0;
    const totalAmount = parseFloat((baseAmount + cleaningFee + serviceFee + taxes).toFixed(2));

    const status = effectiveInstantBook ? 'confirmed' : 'pending';

    // Deposit lifecycle: held immediately, claim deadline = checkout + 48 h
    const depositStatus = depositAmount > 0 ? 'held' : 'none';
    const depositClaimDeadline = depositAmount > 0
      ? new Date(new Date(dto.checkOut).getTime() + 48 * 60 * 60 * 1000)
      : null;

    const booking = this.bookingsRepo.create({
      propertyId: dto.propertyId,
      guestId,
      hostId: property.hostId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      guestsCount: dto.guestsCount,
      nights,
      baseAmount,
      cleaningFee,
      serviceFee,
      taxes,
      totalAmount,
      depositAmount,
      depositStatus,
      depositClaimDeadline,
      currency: property.currency,
      status,
      cancellationPolicy: property.cancellationPolicy ?? 'flexible',
      guestNote: dto.guestNote,
      specialRequests: dto.specialRequests,
    });

    const saved = await this.bookingsRepo.save(booking);

    // G18: Race-condition guard — re-verify no concurrent booking for the same dates was just saved
    const concurrentConflict = await this.bookingsRepo
      .createQueryBuilder('b')
      .where('b.property_id = :pid', { pid: dto.propertyId })
      .andWhere('b.id != :myId', { myId: saved.id })
      .andWhere('b.status IN (:...statuses)', { statuses: ['pending', 'confirmed', 'in_progress'] })
      .andWhere('b.check_in < :checkOut', { checkOut: dto.checkOut })
      .andWhere('b.check_out > :checkIn', { checkIn: dto.checkIn })
      .getCount();

    if (concurrentConflict > 0) {
      await this.bookingsRepo.delete(saved.id);
      throw new ConflictException(
        'These dates were just booked by another guest. Please select different dates and try again.',
      );
    }

    // Block the dates in availability
    const datesToBlock: string[] = [];
    for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
      datesToBlock.push(d.toISOString().split('T')[0]);
    }
    for (const date of datesToBlock) {
      let av = await this.availabilityRepo.findOne({
        where: { propertyId: dto.propertyId, date },
      });
      if (av) {
        av.isBlocked = true;
      } else {
        av = this.availabilityRepo.create({
          propertyId: dto.propertyId,
          date,
          isBlocked: true,
        });
      }
      await this.availabilityRepo.save(av);
    }

    // Notify host
    await this.notificationsService.create(
      property.hostId,
      'booking_request',
      'New Booking Request',
      'طلب حجز جديد',
      `You have a new booking request for ${property.title}`,
      `لديك طلب حجز جديد لـ ${property.title}`,
      { bookingId: saved.id, propertyId: dto.propertyId },
    );

    // Update guest's lastBookingAt timestamp (best-effort)
    this.usersRepo.update(guestId, { lastBookingAt: new Date() } as any).catch(() => {});

    // Audit log
    this.auditLog.log({
      eventType: 'booking.created',
      actorId: guestId,
      entityType: 'booking',
      entityId: saved.id,
      metadata: { propertyId: dto.propertyId, checkIn: dto.checkIn, checkOut: dto.checkOut, totalAmount, status },
    }).catch(() => {});

    // Send email to host
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const reservationsUrl = `${fe.replace(/\/+$/, '')}/en/hosting/reservations`;
      await this.mail.send(
        property.host.email,
        'New booking request — Journey Stay',
        tplBookingRequestReceived(
          property.host.firstName,
          guest.firstName,
          property.title,
          saved.checkIn,
          saved.checkOut,
          saved.guestsCount,
          Number(saved.totalAmount).toFixed(2),
          saved.currency ?? 'EGP',
          reservationsUrl,
        ),
      );
    } catch (e) {
      this.logger.error(`Failed to send booking request email: ${(e as Error).message}`);
    }

    // Send acknowledgment/confirmation email to guest
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
      if (property.instantBook) {
        // Instant-book: booking is already confirmed — send the booking confirmed email
        await this.mail.send(
          guest.email,
          'Your booking is confirmed — Journey Stay',
          tplBookingConfirmed(
            guest.firstName,
            property.title,
            saved.checkIn,
            saved.checkOut,
            saved.guestsCount,
            Number(saved.totalAmount).toFixed(2),
            saved.currency ?? 'EGP',
            `JS-${saved.id}`,
            tripsUrl,
          ),
        );
      } else {
        // Normal flow: booking is pending host approval — send request submitted email
        await this.mail.send(
          guest.email,
          'Booking request received — Journey Stay',
          tplBookingRequestSubmitted(
            guest.firstName,
            property.title,
            saved.checkIn,
            saved.checkOut,
            saved.guestsCount,
            Number(saved.totalAmount).toFixed(2),
            saved.currency ?? 'EGP',
            `JS-${saved.id}`,
            saved.cancellationPolicy ?? 'flexible',
            tripsUrl,
          ),
        );
      }
    } catch (e) {
      this.logger.error(`Failed to send guest acknowledgment email: ${(e as Error).message}`);
    }

    return this.findOne(saved.id);
  }

  async confirm(bookingId: number, hostId: number): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (booking.hostId !== hostId) throw new ForbiddenException('Not your booking');
    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending state');
    }

    await this.bookingsRepo.update(bookingId, { status: 'confirmed' });

    // If property is in approve_first_three mode, increment the approved count
    // so the property can graduate to instant book after 3 approvals
    try {
      const prop = await this.propertiesRepo.findOne({ where: { id: booking.propertyId } });
      if (prop && prop.bookingMode === 'approve_first_three' && prop.approvedBookingsCount < 3) {
        await this.propertiesRepo.increment({ id: booking.propertyId }, 'approvedBookingsCount', 1);
      }
    } catch (e) {
      this.logger.warn(`Could not update approvedBookingsCount: ${(e as Error).message}`);
    }

    await this.notificationsService.create(
      booking.guestId,
      'booking_confirmed',
      'Booking Confirmed',
      'تم تأكيد الحجز',
      `Your booking has been confirmed`,
      `تم تأكيد حجزك`,
      { bookingId },
    );

    // B6 — notify accepted cleaners of the new cleaning job
    try {
      const cleaners = await this.cohostsRepo.find({
        where: { propertyId: booking.propertyId, role: 'cleaner', status: 'accepted' },
      });
      for (const c of cleaners) {
        await this.notificationsService.create(
          c.cohostId,
          'cleaning_scheduled',
          'New cleaning job scheduled',
          'تم جدولة تنظيف جديد',
          `Checkout on ${booking.checkOut} at ${booking.property.title}`,
          `الخروج في ${booking.checkOut} بـ${booking.property.title}`,
          { bookingId, propertyId: booking.propertyId, checkOut: booking.checkOut },
        );
      }
    } catch (e) {
      this.logger.error(`Failed to notify cleaners: ${(e as Error).message}`);
    }

    // Send confirmation email to guest
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
      await this.mail.send(
        booking.guest.email,
        'Your booking is confirmed — Journey Stay',
        tplBookingConfirmed(
          booking.guest.firstName,
          booking.property.title,
          booking.checkIn,
          booking.checkOut,
          booking.guestsCount,
          Number(booking.totalAmount).toFixed(2),
          booking.currency ?? 'EGP',
          `#${bookingId}`,
          tripsUrl,
        ),
      );
    } catch (e) {
      this.logger.error(`Failed to send booking confirmation email: ${(e as Error).message}`);
    }

    return this.findOne(bookingId);
  }

  async decline(bookingId: number, hostId: number, reason?: string): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (booking.hostId !== hostId) throw new ForbiddenException('Not your booking');
    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending state');
    }

    await this.bookingsRepo.update(bookingId, {
      status: 'declined',
      cancellationReason: reason,
    });

    // Unblock dates
    await this.unblockDates(booking.propertyId, booking.checkIn, booking.checkOut);

    await this.notificationsService.create(
      booking.guestId,
      'booking_declined',
      'Booking Declined',
      'تم رفض الحجز',
      `Your booking request has been declined${reason ? `: ${reason}` : ''}`,
      `تم رفض طلب حجزك${reason ? `: ${reason}` : ''}`,
      { bookingId },
    );

    return this.findOne(bookingId);
  }

  async cancel(bookingId: number, userId: number, reason?: string): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);

    if (booking.guestId !== userId && booking.hostId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this booking');
    }
    if (['completed', 'cancelled', 'declined'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const cancelledBy = booking.guestId === userId ? 'guest' : 'host';

    // Guests cannot cancel after check-in has started
    if (cancelledBy === 'guest') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(booking.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      if (today >= checkInDate) {
        throw new BadRequestException('Cancellations are not allowed on or after the check-in date');
      }
    }

    // 5.2 — For in-progress bookings cancelled by the host, prorate based on nights delivered
    const refundInfo = (booking.status === 'in_progress' && cancelledBy === 'host')
      ? this.calculateProratedRefund(booking)
      : this.calculateRefund(booking, cancelledBy);

    // If paid via Stripe, trigger automatic refund before updating DB status
    let stripeRefundTriggered = false;
    if (booking.stripePaymentIntentId && booking.paymentStatus === 'paid' && refundInfo.refundAmount > 0) {
      try {
        const currency = (booking.currency ?? 'EGP').toLowerCase();
        const isZeroDecimal = ['jpy', 'krw', 'vnd'].includes(currency);
        const refundAmountSmallest = isZeroDecimal
          ? Math.round(refundInfo.refundAmount)
          : Math.round(refundInfo.refundAmount * 100);
        await this.stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          amount: refundAmountSmallest,
        });
        stripeRefundTriggered = true;
      } catch (err) {
        this.logger.error(`Stripe refund failed for booking #${bookingId}: ${(err as Error).message}`);
        // Do not block cancellation if Stripe call fails — admin can handle manually
      }
    }

    // If paid via OPay, trigger OPay refund before updating DB status
    let opayRefundTriggered = false;
    if (
      booking.opayOrderReference &&
      booking.paymentMethod === 'opay-card' &&
      booking.paymentStatus === 'paid' &&
      refundInfo.refundAmount > 0
    ) {
      try {
        await this.paymentsService.triggerOpayRefund(
          booking.opayOrderReference,
          refundInfo.refundAmount,
          bookingId,
        );
        opayRefundTriggered = true;
      } catch (err) {
        this.logger.error(`OPay refund failed for booking #${bookingId}: ${(err as Error).message}`);
        // Do not block cancellation if OPay call fails — admin can handle manually
      }
    }

    // Only mark as refunded when an automated refund was actually triggered and confirmed.
    // InstaPay refunds are manual — keep paymentStatus as 'paid' so admin knows to act.
    // If Stripe/OPay API call failed (opayRefundTriggered/stripeRefundTriggered still false),
    // also keep 'paid' so admin can retry rather than falsely marking it refunded.
    const newPaymentStatus = (stripeRefundTriggered || opayRefundTriggered)
      ? 'refunded'
      : booking.paymentStatus;

    await this.bookingsRepo.update(bookingId, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledBy,
      cancelledAt: new Date(),
      refundAmount: refundInfo.refundAmount,
      cancellationFee: refundInfo.cancellationFee,
      paymentStatus: newPaymentStatus,
    });

    // Audit log
    this.auditLog.log({
      eventType: 'booking.cancelled',
      actorId: userId,
      entityType: 'booking',
      entityId: bookingId,
      metadata: { cancelledBy, reason, refundAmount: refundInfo.refundAmount, policy: booking.cancellationPolicy },
    }).catch(() => {});

    // Decrement approvedBookingsCount if this was a confirmed booking under approve_first_three mode
    if (booking.status === 'confirmed') {
      const propForCount = await this.propertiesRepo.findOne({ where: { id: booking.propertyId } });
      if (propForCount?.bookingMode === 'approve_first_three' && (propForCount.approvedBookingsCount ?? 0) > 0) {
        await this.propertiesRepo.decrement({ id: booking.propertyId }, 'approvedBookingsCount', 1);
      }
    }

    // Unblock dates
    await this.unblockDates(booking.propertyId, booking.checkIn, booking.checkOut);

    // X13: Remove ALL earnings for this booking (cancel-after-dispute may have created multiple rows)
    // then create a single replacement if the host retains any amount.
    const existingEarnings = await this.earningsRepo.find({ where: { bookingId } });
    if (existingEarnings.length > 0) {
      await this.earningsRepo.remove(existingEarnings);
      // When the host retains part of the payment (partial/no refund policy), create a replacement earning
      if (refundInfo.hostRetains > 0) {
        const checkOutDate = new Date(booking.checkOut);
        const availableAt = new Date(checkOutDate);
        availableAt.setDate(availableAt.getDate() + 1);
        await this.earningsRepo.save(this.earningsRepo.create({
          hostId: booking.hostId,
          bookingId,
          amount: parseFloat(refundInfo.hostRetains.toFixed(2)),
          platformFee: 0,
          currency: booking.currency ?? 'EGP',
          status: new Date() >= availableAt ? 'available' : 'pending',
          availableAt,
        }));
        this.logger.log(`Replacement earning created for cancelled booking #${bookingId} — host retains ${refundInfo.hostRetains}`);
      }
    }

    // Notify the other party
    const notifyUserId = booking.guestId === userId ? booking.hostId : booking.guestId;
    const refundNote = refundInfo.refundAmount > 0
      ? ` Refund: ${booking.currency} ${refundInfo.refundAmount.toFixed(2)}`
      : '';
    await this.notificationsService.create(
      notifyUserId,
      'booking_cancelled',
      'Booking Cancelled',
      'تم إلغاء الحجز',
      `A booking has been cancelled${reason ? `: ${reason}` : ''}.${refundNote}`,
      `تم إلغاء حجز${reason ? `: ${reason}` : ''}.${refundNote}`,
      { bookingId },
    );

    // Send cancellation emails to both parties
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const curr = booking.currency ?? 'EGP';
      const ref = `#${bookingId}`;
      const refundStr = refundInfo.refundAmount > 0 ? refundInfo.refundAmount.toFixed(2) : undefined;
      const selfUser = cancelledBy === 'guest' ? booking.guest : booking.host;
      const otherRole: 'guest' | 'host' = cancelledBy === 'guest' ? 'host' : 'guest';
      const otherUser = cancelledBy === 'guest' ? booking.host : booking.guest;
      await this.mail.send(
        selfUser.email,
        'Booking cancelled — Journey Stay',
        tplBookingCancelled(selfUser.firstName, cancelledBy, booking.property.title, booking.checkIn, booking.checkOut, ref, refundStr, curr),
      );
      await this.mail.send(
        otherUser.email,
        'Booking cancelled — Journey Stay',
        tplBookingCancelled(otherUser.firstName, otherRole, booking.property.title, booking.checkIn, booking.checkOut, ref),
      );
    } catch (e) {
      this.logger.error(`Failed to send cancellation emails: ${(e as Error).message}`);
    }

    // If Stripe refund was triggered, send a dedicated refund notification to the guest
    if (stripeRefundTriggered && cancelledBy === 'guest') {
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
        await this.mail.send(
          booking.guest.email,
          'Your Stripe refund is being processed — Journey Stay',
          tplRefundNotification(
            booking.guest.firstName,
            refundInfo.refundAmount.toFixed(2),
            booking.currency ?? 'EGP',
            booking.property.title,
            `#${bookingId}`,
            new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
            'Credit / Debit Card',
            tripsUrl,
          ),
        );
      } catch (e) {
        this.logger.error(`Failed to send Stripe refund email: ${(e as Error).message}`);
      }
    }

    // If OPay refund was triggered, send a dedicated refund notification to the guest
    if (opayRefundTriggered && cancelledBy === 'guest') {
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
        await this.mail.send(
          booking.guest.email,
          'Your OPay refund is being processed — Journey Stay',
          tplRefundNotification(
            booking.guest.firstName,
            refundInfo.refundAmount.toFixed(2),
            booking.currency ?? 'EGP',
            booking.property.title,
            `#${bookingId}`,
            new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
            'OPay',
            tripsUrl,
          ),
        );
      } catch (e) {
        this.logger.error(`Failed to send OPay refund email: ${(e as Error).message}`);
      }
    }

    // 4.2 — If cancelled with a paid InstaPay booking: notify guest manual refund is pending + alert admins
    if (
      booking.paymentMethod === 'instapay' &&
      booking.paymentStatus === 'paid' &&
      refundInfo.refundAmount > 0
    ) {
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
        await this.mail.send(
          booking.guest.email,
          'Your InstaPay refund is being arranged — Journey Stay',
          tplInstapayRefundPending(
            booking.guest.firstName,
            booking.property.title,
            refundInfo.refundAmount.toFixed(2),
            booking.currency ?? 'EGP',
            `#${bookingId}`,
            tripsUrl,
          ),
        );
      } catch (e) {
        this.logger.error(`Failed to send InstaPay refund pending email: ${(e as Error).message}`);
      }
      // Notify all admins so they can action the manual transfer
      try {
        const admins = await this.usersRepo.find({ where: { isAdmin: true } });
        await Promise.all(
          admins.map((admin) =>
            this.notificationsService.create(
              admin.id,
              'instapay_refund_pending',
              'InstaPay Refund Required',
              'يلزم استرداد InstaPay يدوياً',
              `Booking #${bookingId} was cancelled with a paid InstaPay amount of ${booking.currency ?? 'EGP'} ${refundInfo.refundAmount.toFixed(2)}. Manual refund required.`,
              `تم إلغاء الحجز #${bookingId} بمبلغ InstaPay مدفوع ${booking.currency ?? 'EGP'} ${refundInfo.refundAmount.toFixed(2)}. يلزم الاسترداد اليدوي.`,
              { bookingId },
            ),
          ),
        );
      } catch (e) {
        this.logger.error(`Failed to notify admins of InstaPay refund: ${(e as Error).message}`);
      }
    }

    // H12 — When host cancels: send follow-up rebooking email to guest
    if (cancelledBy === 'host') {
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const propertyUrl = `${fe.replace(/\/+$/, '')}/en/properties/${booking.propertyId}`;
        await this.mail.send(
          booking.guest.email,
          `Your stay at ${booking.property.title} was cancelled — Journey Stay`,
          tplHostCancelledRebooking(
            booking.guest.firstName,
            booking.property.title,
            booking.checkIn,
            booking.checkOut,
            `#${bookingId}`,
            propertyUrl,
          ),
        );
      } catch (e) {
        this.logger.error(`Failed to send host-cancellation rebooking email: ${(e as Error).message}`);
      }
    }

    return this.findOne(bookingId);
  }
    const booking = await this.findOne(bookingId);

    if (booking.guestId !== userId && booking.hostId !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    if (['completed', 'cancelled', 'declined'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const cancelledBy = booking.guestId === userId ? 'guest' : 'host';

    // Guests cannot cancel after check-in has started
    if (cancelledBy === 'guest') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(booking.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      if (today >= checkInDate) {
        throw new BadRequestException('Cancellations are not allowed on or after the check-in date');
      }
    }

    const refundInfo = this.calculateRefund(booking, cancelledBy);

    return {
      bookingId,
      cancellationPolicy: booking.cancellationPolicy ?? 'flexible',
      daysUntilCheckIn: refundInfo.daysUntilCheckIn,
      refundEligibility: refundInfo.eligibility,
      cancelledBy,
      breakdown: {
        totalPaid: Number(booking.totalAmount),
        refundAmount: refundInfo.refundAmount,
        cancellationFee: refundInfo.cancellationFee,
        nonRefundable: {
          serviceFee: Number(booking.serviceFee),
          cleaningFee: Number(booking.cleaningFee),
          firstNight: refundInfo.firstNightCost,
          retainedByHost: refundInfo.hostRetains,
        },
        hostReceives: refundInfo.hostReceives,
      },
      message: refundInfo.message,
    };
  }

  /** 5.2 — Prorate refund for a host-cancelled in-progress booking */
  private calculateProratedRefund(booking: BookingEntity) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(0, 0, 0, 0);

    const totalNights = Number(booking.nights) || 1;
    const deliveredNights = Math.max(
      0,
      Math.round((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const remainingNights = Math.max(0, totalNights - deliveredNights);

    const baseAmount = Number(booking.baseAmount);
    const serviceFee = Number(booking.serviceFee);
    const cleaningFee = Number(booking.cleaningFee);
    const taxes = Number(booking.taxes);
    const totalAmount = Number(booking.totalAmount);

    const pricePerNight = totalNights > 0 ? baseAmount / totalNights : baseAmount;
    const hostRetains = parseFloat((deliveredNights * pricePerNight + cleaningFee).toFixed(2));
    const refundableBase = parseFloat((remainingNights * pricePerNight).toFixed(2));
    const refundableTaxes = totalNights > 0
      ? parseFloat((taxes * remainingNights / totalNights).toFixed(2))
      : 0;
    const refundAmount = parseFloat((refundableBase + refundableTaxes).toFixed(2));
    const cancellationFee = parseFloat((totalAmount - refundAmount).toFixed(2));

    return {
      refundAmount,
      cancellationFee,
      eligibility: (remainingNights > 0 ? 'partial' : 'none') as 'partial' | 'none',
      daysUntilCheckIn: 0,
      firstNightCost: pricePerNight,
      hostRetains,
      hostReceives: hostRetains,
      message: `Mid-stay host cancellation — ${deliveredNights} night(s) delivered, refund for ${remainingNights} remaining night(s).`,
    };
  }

  private calculateRefund(
    booking: BookingEntity,
    cancelledBy: 'guest' | 'host',
  ): {
    refundAmount: number;
    cancellationFee: number;
    eligibility: 'full' | 'partial' | 'none';
    daysUntilCheckIn: number;
    firstNightCost: number;
    hostRetains: number;
    hostReceives: number;
    message: string;
  } {
    const baseAmount = Number(booking.baseAmount);
    const cleaningFee = Number(booking.cleaningFee);
    const serviceFee = Number(booking.serviceFee);
    const taxes = Number(booking.taxes);
    const totalAmount = Number(booking.totalAmount);
    const nights = Number(booking.nights) || 1;
    const firstNightCost = parseFloat((baseAmount / nights).toFixed(2));

    // If host cancels, guest gets full refund
    if (cancelledBy === 'host') {
      return {
        refundAmount: totalAmount,
        cancellationFee: 0,
        eligibility: 'full',
        daysUntilCheckIn: 0,
        firstNightCost: 0,
        hostRetains: 0,
        hostReceives: 0,
        message: 'Host cancelled — full refund issued to guest.',
      };
    }

    // If payment hasn't been made, no financial action needed
    if (booking.paymentStatus === 'pending') {
      return {
        refundAmount: 0,
        cancellationFee: 0,
        eligibility: 'full',
        daysUntilCheckIn: 0,
        firstNightCost: 0,
        hostRetains: 0,
        hostReceives: 0,
        message: 'Booking cancelled — no payment was made.',
      };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    const policy = booking.cancellationPolicy ?? 'flexible';

    // Determine refund windows
    let freeWindow: number;
    let partialWindow: number;
    switch (policy) {
      case 'strict':
        freeWindow = 14;
        partialWindow = 7;
        break;
      case 'moderate':
        freeWindow = 5;
        partialWindow = 1;
        break;
      case 'flexible':
      default:
        freeWindow = 1;
        partialWindow = 0;
        break;
    }

    // Service fee is never refunded; cleaning fee is refunded only if the guest never arrived
    const nonRefundableFixed = serviceFee;
    // Cleaning fee is refundable when the guest cancels before check-in (0-night stay)
    const refundableCleaning = daysUntilCheckIn > 0 ? cleaningFee : 0;

    if (daysUntilCheckIn >= freeWindow) {
      // FULL refund of base + taxes + cleaning fee (guest never arrived)
      const refundAmount = parseFloat((baseAmount + taxes + refundableCleaning).toFixed(2));
      return {
        refundAmount,
        cancellationFee: parseFloat((totalAmount - refundAmount).toFixed(2)),
        eligibility: 'full',
        daysUntilCheckIn,
        firstNightCost: 0,
        hostRetains: 0,
        hostReceives: 0,
        message: `Free cancellation — you'll receive a refund of ${refundAmount.toFixed(2)}.`,
      };
    }

    if (daysUntilCheckIn >= partialWindow && daysUntilCheckIn < freeWindow) {
      // PARTIAL refund: first night non-refundable, 50% of remaining; cleaning fee refunded since guest never arrived
      const remainingBase = baseAmount - firstNightCost;
      const refundableBase = parseFloat((remainingBase * 0.5).toFixed(2));
      const refundableTaxes = baseAmount > 0
        ? parseFloat((taxes * (refundableBase / baseAmount)).toFixed(2))
        : 0;
      const refundAmount = parseFloat((refundableBase + refundableTaxes + refundableCleaning).toFixed(2));
      const hostRetains = parseFloat((firstNightCost + remainingBase * 0.5).toFixed(2));
      return {
        refundAmount,
        cancellationFee: parseFloat((totalAmount - refundAmount).toFixed(2)),
        eligibility: 'partial',
        daysUntilCheckIn,
        firstNightCost,
        hostRetains,
        hostReceives: hostRetains,
        message: `Partial refund — first night is non-refundable. You'll receive ${refundAmount.toFixed(2)}.`,
      };
    }

    // NO refund of room cost — but cleaning fee still returned if guest never arrived
    const noRefundCleaningBack = refundableCleaning;
    return {
      refundAmount: noRefundCleaningBack,
      cancellationFee: parseFloat((totalAmount - noRefundCleaningBack).toFixed(2)),
      eligibility: 'none',
      daysUntilCheckIn,
      firstNightCost,
      hostRetains: baseAmount,
      hostReceives: baseAmount,
      message: noRefundCleaningBack > 0
        ? `No refund for the stay — cancellation is past the deadline. Cleaning fee of ${noRefundCleaningBack.toFixed(2)} returned since you never checked in.`
        : 'No refund — cancellation is past the deadline.',
    };
  }

  async complete(bookingId: number): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);

    await this.bookingsRepo.update(bookingId, {
      status: 'completed',
      paymentStatus: 'paid',
    });

    // Notify guest to leave a review
    await this.notificationsService.create(
      booking.guestId,
      'review_request',
      'How was your stay?',
      'كيف كانت إقامتك؟',
      `Your stay at ${booking.property?.title ?? 'the property'} is complete. Share your experience to help future guests.`,
      `اكتملت إقامتك في ${booking.property?.title ?? 'العقار'}. شارك تجربتك لتساعد الضيوف القادمين.`,
      { bookingId, propertyId: booking.propertyId },
    ).catch(() => {/* best-effort */});

    // Notify host to review the guest
    await this.notificationsService.create(
      booking.property?.hostId ?? (booking as any).hostId,
      'review_request',
      'Review your guest',
      'قيّم ضيفك',
      `${booking.guest?.firstName ?? 'Your guest'}'s stay has ended. Leave a review to share your experience hosting them.`,
      `انتهت إقامة ${booking.guest?.firstName ?? 'ضيفك'}. اترك تقييمًا لمشاركة تجربتك.`,
      { bookingId, guestId: booking.guestId },
    ).catch(() => {/* best-effort */});

    return this.findOne(bookingId);
  }

  async submitPayment(
    bookingId: number,
    guestId: number,
    dto: { method: string; reference: string; note?: string; proofUrl?: string },
  ): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (booking.guestId !== guestId) throw new ForbiddenException('Not your booking');
    if (!['confirmed', 'pending'].includes(booking.status) && booking.paymentStatus !== 'submitted' && booking.paymentStatus !== 'declined') {
      throw new BadRequestException('Booking is not in a payable state');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('Payment has already been confirmed');
    }
    await this.bookingsRepo.update(bookingId, {
      paymentMethod: dto.method,
      paymentReference: dto.reference,
      paymentNote: dto.note ?? null,
      paymentProofUrl: dto.proofUrl ?? null,
      paymentStatus: 'submitted' as any,
    });

    this.auditLog.log({
      eventType: 'payment.submitted',
      actorId: guestId,
      entityType: 'booking',
      entityId: bookingId,
      metadata: { method: dto.method, reference: dto.reference },
    }).catch(() => {});

    await this.notificationsService.create(
      booking.hostId,
      'payment_submitted',
      'Payment Submitted',
      'تم إرسال الدفع',
      `Guest submitted an InstaPay transfer for booking #${bookingId}. Ref: ${dto.reference}`,
      `أرسل الضيف تحويل InstaPay للحجز #${bookingId}. المرجع: ${dto.reference}`,
      { bookingId },
    );

    return this.findOne(bookingId);
  }

  async confirmPayment(bookingId: number, userId: number, isAdmin: boolean): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (!isAdmin && booking.hostId !== userId) {
      throw new ForbiddenException('Only the host or an admin can confirm payment');
    }
    await this.bookingsRepo.update(bookingId, {
      paymentStatus: 'paid',
      status: booking.status === 'pending' ? 'confirmed' : booking.status,
    });

    this.auditLog.log({
      eventType: 'payment.confirmed',
      actorId: userId,
      entityType: 'booking',
      entityId: bookingId,
      metadata: { isAdmin, totalAmount: Number(booking.totalAmount), method: booking.paymentMethod },
    }).catch(() => {});

    await this.notificationsService.create(
      booking.guestId,
      'payment_confirmed',
      'Payment Confirmed',
      'تم تأكيد الدفع',
      `Your payment for booking #${bookingId} has been confirmed. Your stay is all set! 🎉`,
      `تم تأكيد دفعك للحجز #${bookingId}. إقامتك جاهزة! 🎉`,
      { bookingId },
    );

    // Send confirmation email to guest
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
      await this.mail.send(
        booking.guest.email,
        'Your InstaPay payment is confirmed — Journey Stay',
        tplInstapayPaymentConfirmed(
          booking.guest.firstName,
          `#${bookingId}`,
          booking.property.title,
          booking.checkIn,
          booking.checkOut,
          Number(booking.totalAmount).toFixed(2),
          booking.currency ?? 'EGP',
          tripsUrl,
        ),
      );
    } catch (e) {
      this.logger.error(`Failed to send InstaPay confirmation email: ${(e as Error).message}`);
    }

    return this.findOne(bookingId);
  }

  async declinePayment(bookingId: number, userId: number, isAdmin: boolean, reason?: string): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (!isAdmin && booking.hostId !== userId) {
      throw new ForbiddenException('Only the host or an admin can decline payment');
    }
    if (booking.paymentStatus !== 'submitted') {
      throw new BadRequestException('Payment is not in submitted state');
    }

    await this.bookingsRepo.update(bookingId, {
      paymentStatus: 'declined' as any,
      paymentNote: reason ?? booking.paymentNote,
    });

    await this.notificationsService.create(
      booking.guestId,
      'payment_declined',
      'Payment Could Not Be Verified',
      'تعذّر التحقق من الدفع',
      `Your InstaPay payment for booking #${bookingId} could not be verified.${reason ? ` Reason: ${reason}` : ''} Please retry from My Trips.`,
      `تعذّر التحقق من دفعك للحجز #${bookingId}.${reason ? ` السبب: ${reason}` : ''} يرجى المحاولة مرة أخرى من رحلاتي.`,
      { bookingId },
    );

    // Send decline email to guest
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
      await this.mail.send(
        booking.guest.email,
        'Payment could not be verified — Journey Stay',
        tplInstapayPaymentDeclined(
          booking.guest.firstName,
          `#${bookingId}`,
          booking.property.title,
          reason,
          tripsUrl,
        ),
      );
    } catch (e) {
      this.logger.error(`Failed to send InstaPay decline email: ${(e as Error).message}`);
    }

    return this.findOne(bookingId);
  }

  /** Admin: mark an InstaPay cancelled-booking refund as completed (money sent manually). */
  async markInstapayRefunded(bookingId: number, reason?: string): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (booking.paymentMethod !== 'instapay') {
      throw new BadRequestException('Not an InstaPay booking');
    }
    if (booking.status !== 'cancelled') {
      throw new BadRequestException('Booking is not cancelled');
    }
    if (booking.paymentStatus === 'refunded') {
      throw new BadRequestException('Payment is already marked as refunded');
    }
    if (booking.paymentStatus !== 'paid') {
      throw new BadRequestException('Payment must be in paid state to mark as refunded');
    }

    await this.bookingsRepo.update(bookingId, {
      paymentStatus: 'refunded',
      refundReason: reason ?? null,
    } as any);

    this.auditLog.log({
      eventType: 'payment.refunded',
      actorId: null,
      entityType: 'booking',
      entityId: bookingId,
      metadata: { method: 'instapay', reason, refundAmount: Number(booking.refundAmount ?? booking.totalAmount) },
    }).catch(() => {});

    await this.notificationsService.create(
      booking.guestId,
      'instapay_refund_completed',
      'InstaPay Refund Sent',
      'تم إرسال استرداد InstaPay',
      `Your InstaPay refund for booking #${bookingId} has been sent to your account.`,
      `تم إرسال استرداد InstaPay للحجز #${bookingId} إلى حسابك.`,
      { bookingId },
    );

    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
      const refundAmt = (booking.refundAmount != null ? Number(booking.refundAmount) : Number(booking.totalAmount)).toFixed(2);
      await this.mail.send(
        booking.guest.email,
        'Your InstaPay refund has been sent — Journey Stay',
        tplInstapayRefundCompleted(
          booking.guest.firstName,
          booking.property.title,
          refundAmt,
          booking.currency ?? 'EGP',
          `#${bookingId}`,
          tripsUrl,
        ),
      );
    } catch (e) {
      this.logger.error(`Failed to send InstaPay refund completed email: ${(e as Error).message}`);
    }

    return this.findOne(bookingId);
  }

  async getGuestBookings(guestId: number, status?: string) {
    const where: any = { guestId };
    if (status) where.status = status;

    return this.bookingsRepo.find({
      where,
      relations: ['property', 'property.photos'],
      order: { createdAt: 'DESC' },
    });
  }

  async getHostCalendar(hostId: number, month: string) {
    // month format: YYYY-MM
    const [year, mon] = month.split('-').map(Number);
    if (!year || !mon) throw new BadRequestException('month must be YYYY-MM');
    const from = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const to = `${month}-${String(lastDay).padStart(2, '0')}`;

    const bookings = await this.bookingsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.property', 'p')
      .leftJoinAndSelect('p.photos', 'ph')
      .leftJoinAndSelect('b.guest', 'g')
      .where('b.hostId = :hostId', { hostId })
      .andWhere('b.status IN (:...statuses)', { statuses: ['pending', 'confirmed', 'completed'] })
      .andWhere('b.checkIn <= :to', { to })
      .andWhere('b.checkOut >= :from', { from })
      .orderBy('b.checkIn', 'ASC')
      .getMany();

    return bookings;
  }

  async getHostBookings(hostId: number, status?: string) {
    if (status === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      return this.bookingsRepo.find({
        where: { hostId, status: 'confirmed', checkIn: MoreThanOrEqual(today) },
        relations: ['property', 'property.photos', 'guest'],
        order: { checkIn: 'ASC' },
      });
    }
    const where: any = { hostId };
    if (status) where.status = status;

    return this.bookingsRepo.find({
      where,
      relations: ['property', 'property.photos', 'guest'],
      order: { createdAt: 'DESC' },
    });
  }

  /** 2.2 — Bookings where the host has received InstaPay transfer proof (paymentStatus = 'submitted') */
  async getHostPendingPayments(hostId: number) {
    return this.bookingsRepo.find({
      where: { hostId, paymentStatus: 'submitted' },
      relations: ['property', 'guest'],
      order: { createdAt: 'DESC' },
    });
  }

  async getHostAnalytics(hostId: number) {
    const allBookings = await this.bookingsRepo.find({
      where: { hostId },
      relations: ['property', 'property.photos'],
      order: { createdAt: 'DESC' },
    });

    const byStatus: Record<string, number> = {
      pending: 0, confirmed: 0, completed: 0, cancelled: 0, declined: 0,
    };
    let totalRevenue = 0;
    let totalBaseRevenue = 0;
    let totalCleaningFees = 0;
    let totalServiceFees = 0;
    let totalNights = 0;
    let confirmedOrCompleted = 0;

    for (const b of allBookings) {
      byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
      if (b.status === 'completed' || b.status === 'confirmed') {
        totalRevenue += Number(b.totalAmount) - Number(b.serviceFee);
        totalBaseRevenue += Number(b.baseAmount);
        totalCleaningFees += Number(b.cleaningFee);
        totalServiceFees += Number(b.serviceFee);
        confirmedOrCompleted += 1;
      }
      totalNights += Number(b.nights) || 0;
    }

    // Monthly breakdown — last 12 months
    const monthly: Record<string, { bookings: number; revenue: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = { bookings: 0, revenue: 0 };
    }
    for (const b of allBookings) {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthly) {
        monthly[key].bookings += 1;
        if (b.status === 'completed' || b.status === 'confirmed') {
          monthly[key].revenue += Number(b.totalAmount) - Number(b.serviceFee);
        }
      }
    }

    // Per-property breakdown (with view counts and impression counts)
    const hostProperties = await this.propertiesRepo.find({
      where: { hostId },
      select: ['id', 'viewCount', 'impressionCount'],
    });
    const viewCountByPropertyId = Object.fromEntries(
      hostProperties.map((p) => [p.id, p.viewCount ?? 0]),
    );
    const impressionCountByPropertyId = Object.fromEntries(
      hostProperties.map((p) => [p.id, p.impressionCount ?? 0]),
    );

    const byPropertyMap: Record<number, {
      id: number; title: string; image: string | null;
      bookings: number; revenue: number; nights: number; views: number; impressions: number;
    }> = {};
    for (const b of allBookings) {
      if (!b.property) continue;
      if (!byPropertyMap[b.property.id]) {
        const photos: any[] = (b.property as any).photos ?? [];
        const cover = photos.find((p) => p.isCover) ?? photos[0];
        byPropertyMap[b.property.id] = {
          id: b.property.id,
          title: b.property.title,
          image: cover ? cover.url : null,
          bookings: 0, revenue: 0, nights: 0,
          views: viewCountByPropertyId[b.property.id] ?? 0,
          impressions: impressionCountByPropertyId[b.property.id] ?? 0,
        };
      }
      byPropertyMap[b.property.id].bookings += 1;
      if (b.status === 'completed' || b.status === 'confirmed') {
        byPropertyMap[b.property.id].revenue += Number(b.totalAmount) - Number(b.serviceFee);
      }
      byPropertyMap[b.property.id].nights += Number(b.nights) || 0;
    }

    const completionRate = allBookings.length
      ? Math.round((byStatus.completed / allBookings.length) * 100)
      : 0;
    const avgBookingValue = confirmedOrCompleted > 0
      ? totalRevenue / confirmedOrCompleted
      : 0;

    // This month stats
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = monthly[thisMonthKey] ?? { bookings: 0, revenue: 0 };

    return {
      totals: {
        bookings: allBookings.length,
        byStatus,
        revenue: totalRevenue,
        baseRevenue: totalBaseRevenue,
        cleaningFees: totalCleaningFees,
        serviceFees: totalServiceFees,
        nights: totalNights,
        avgBookingValue,
        completionRate,
        thisMonthBookings: thisMonth.bookings,
        thisMonthRevenue: thisMonth.revenue,
      },
      monthly: Object.entries(monthly).map(([month, data]) => ({ month, ...data })),
      byProperty: Object.values(byPropertyMap).sort((a, b) => b.revenue - a.revenue),
    };
  }

  async modify(
    bookingId: number,
    guestId: number,
    dto: { checkIn: string; checkOut: string; guestsCount?: number },
  ): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);

    if (booking.guestId !== guestId) {
      throw new ForbiddenException('Only the guest can modify this booking');
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new BadRequestException('Only pending or confirmed bookings can be modified');
    }

    const checkInDate = new Date(dto.checkIn);
    const checkOutDate = new Date(dto.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }
    if (checkOutDate <= checkInDate) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const property = await this.propertiesRepo.findOne({ where: { id: booking.propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    if (nights < property.minNights) {
      throw new BadRequestException(`Minimum stay is ${property.minNights} nights`);
    }
    if (nights > property.maxNights) {
      throw new BadRequestException(`Maximum stay is ${property.maxNights} nights`);
    }

    const guestsCount = dto.guestsCount ?? booking.guestsCount;
    if (guestsCount > property.maxGuests) {
      throw new BadRequestException(`Maximum ${property.maxGuests} guests allowed`);
    }

    // Check availability excluding this booking's dates
    const conflictCount = await this.bookingsRepo
      .createQueryBuilder('b')
      .where('b.propertyId = :propertyId', { propertyId: booking.propertyId })
      .andWhere('b.id != :bookingId', { bookingId })
      .andWhere('b.status IN (:...statuses)', { statuses: ['pending', 'confirmed'] })
      .andWhere('b.checkIn < :checkOut', { checkOut: dto.checkOut })
      .andWhere('b.checkOut > :checkIn', { checkIn: dto.checkIn })
      .getCount();

    if (conflictCount > 0) {
      throw new BadRequestException('Property is not available for the selected dates');
    }

    // Also check manually blocked availability slots (excluding the ones for this booking)
    await this.unblockDates(booking.propertyId, booking.checkIn, booking.checkOut);

    // Check blocked dates for new range
    const blockedCount = await this.availabilityRepo
      .createQueryBuilder('av')
      .where('av.propertyId = :propertyId', { propertyId: booking.propertyId })
      .andWhere('av.date >= :checkIn', { checkIn: dto.checkIn })
      .andWhere('av.date < :checkOut', { checkOut: dto.checkOut })
      .andWhere('av.isBlocked = true')
      .getCount();

    if (blockedCount > 0) {
      // Re-block the old dates since we unblocked them above and new dates aren't available
      const oldCi = new Date(booking.checkIn);
      const oldCo = new Date(booking.checkOut);
      for (let d = new Date(oldCi); d < oldCo; d.setDate(d.getDate() + 1)) {
        const date = d.toISOString().split('T')[0];
        await this.availabilityRepo.update(
          { propertyId: booking.propertyId, date },
          { isBlocked: true },
        );
      }
      throw new BadRequestException('Selected dates include blocked periods');
    }

    // Recalculate price
    const pricePerNight = Number(property.pricePerNight ?? 0);
    const weekendPrice =
      property.weekendPrice != null ? Number(property.weekendPrice) : null;

    let baseAmount = 0;
    for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      const isWeekend = dow === 5 || dow === 6;
      const isPeak = isWeekend || this.isEgyptianPublicHoliday(d);
      baseAmount += isPeak && weekendPrice != null ? weekendPrice : pricePerNight;
    }
    baseAmount = parseFloat(baseAmount.toFixed(2));

    const weeklyDiscount = Number(property.weeklyDiscount ?? 0);
    const monthlyDiscount = Number(property.monthlyDiscount ?? 0);
    let discountPercent = 0;
    if (nights >= 28 && monthlyDiscount > 0) discountPercent = monthlyDiscount;
    else if (nights >= 7 && weeklyDiscount > 0) discountPercent = weeklyDiscount;
    if (discountPercent > 0) {
      const disc = parseFloat(((baseAmount * discountPercent) / 100).toFixed(2));
      baseAmount = parseFloat((baseAmount - disc).toFixed(2));
    }

    const cleaningFee = Number(property.cleaningFee ?? 0);
    const serviceFee = parseFloat(
      ((baseAmount * Number(property.serviceFeePercent ?? 14)) / 100).toFixed(2),
    );
    const totalAmount = parseFloat((baseAmount + cleaningFee + serviceFee).toFixed(2));

    // Block new dates
    for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      let av = await this.availabilityRepo.findOne({
        where: { propertyId: booking.propertyId, date },
      });
      if (av) {
        av.isBlocked = true;
      } else {
        av = this.availabilityRepo.create({
          propertyId: booking.propertyId,
          date,
          isBlocked: true,
        });
      }
      await this.availabilityRepo.save(av);
    }

    await this.bookingsRepo.update(bookingId, {
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      nights,
      guestsCount,
      baseAmount,
      cleaningFee,
      serviceFee,
      totalAmount,
    });

    // Append modification history entry
    const changes: Array<{ field: string; from: unknown; to: unknown }> = [];
    if (dto.checkIn !== booking.checkIn) changes.push({ field: 'checkIn', from: booking.checkIn, to: dto.checkIn });
    if (dto.checkOut !== booking.checkOut) changes.push({ field: 'checkOut', from: booking.checkOut, to: dto.checkOut });
    if (guestsCount !== booking.guestsCount) changes.push({ field: 'guestsCount', from: booking.guestsCount, to: guestsCount });
    if (Number(totalAmount) !== Number(booking.totalAmount)) changes.push({ field: 'totalAmount', from: Number(booking.totalAmount), to: Number(totalAmount) });
    if (changes.length > 0) {
      const historyEntry = { changedAt: new Date().toISOString(), changedBy: 'guest', changes };
      const current = await this.bookingsRepo.findOne({ where: { id: bookingId }, select: ['modificationHistory'] });
      const history = current?.modificationHistory ?? [];
      await this.bookingsRepo.update(bookingId, { modificationHistory: [...history, historyEntry] });
    }

    return this.findOne(bookingId);
  }

  async findOneByRef(bookingUuid: string): Promise<BookingEntity> {
    const booking = await this.bookingsRepo.findOne({
      where: { bookingUuid },
      relations: ['property', 'property.photos', 'guest', 'host'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async findOne(id: number): Promise<BookingEntity> {
    const booking = await this.bookingsRepo.findOne({
      where: { id },
      relations: ['property', 'property.photos', 'guest', 'host'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  /**
   * 4.4 — Admin-triggered refund after dispute resolution favours the guest.
   * Handles Stripe, OPay, and InstaPay (manual) scenarios.
   */
  async refundBooking(bookingId: number): Promise<void> {
    const booking = await this.findOne(bookingId);
    if (booking.paymentStatus !== 'paid') return; // nothing to refund

    const refundAmount = Number(booking.totalAmount);
    let refundTriggered = false;

    // Stripe refund
    if (booking.stripePaymentIntentId) {
      try {
        const currency = (booking.currency ?? 'EGP').toLowerCase();
        const isZeroDecimal = ['jpy', 'krw', 'vnd'].includes(currency);
        const amountSmallest = isZeroDecimal
          ? Math.round(refundAmount)
          : Math.round(refundAmount * 100);
        await this.stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          amount: amountSmallest,
        });
        refundTriggered = true;
      } catch (err) {
        this.logger.error(`[refundBooking] Stripe refund failed for #${bookingId}: ${(err as Error).message}`);
      }
    }

    // OPay refund
    if (!refundTriggered && booking.opayOrderReference && booking.paymentMethod === 'opay-card') {
      try {
        await this.paymentsService.triggerOpayRefund(
          booking.opayOrderReference,
          refundAmount,
          bookingId,
        );
        refundTriggered = true;
      } catch (err) {
        this.logger.error(`[refundBooking] OPay refund failed for #${bookingId}: ${(err as Error).message}`);
      }
    }

    // Update payment status
    const newPaymentStatus = refundTriggered ? 'refunded' : 'paid'; // keep 'paid' for manual instapay
    await this.bookingsRepo.update(bookingId, {
      paymentStatus: newPaymentStatus,
      refundAmount,
    });

    // Reverse any recorded host earnings for this booking (dispute resolved in guest's favour)
    const existingEarning = await this.earningsRepo.findOne({ where: { bookingId } });
    if (existingEarning) {
      await this.earningsRepo.remove(existingEarning);
      this.logger.log(`[refundBooking] Earnings reversed for booking #${bookingId} after dispute refund`);
    }

    // For InstaPay manual refunds: email guest + notify admins
    if (!refundTriggered && booking.paymentMethod === 'instapay') {
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
        await this.mail.send(
          booking.guest.email,
          'Your InstaPay refund is being arranged — Journey Stay',
          tplInstapayRefundPending(
            booking.guest.firstName,
            booking.property.title,
            refundAmount.toFixed(2),
            booking.currency ?? 'EGP',
            `#${bookingId}`,
            tripsUrl,
          ),
        );
      } catch (e) {
        this.logger.error(`[refundBooking] InstaPay refund email failed: ${(e as Error).message}`);
      }
      try {
        const admins = await this.usersRepo.find({ where: { isAdmin: true } });
        await Promise.all(
          admins.map((admin) =>
            this.notificationsService.create(
              admin.id,
              'instapay_refund_pending',
              'InstaPay Refund Required',
              'يلزم استرداد InstaPay يدوياً',
              `Dispute resolved for guest on booking #${bookingId}. Manual InstaPay refund of ${booking.currency ?? 'EGP'} ${refundAmount.toFixed(2)} required.`,
              `تم حل النزاع لصالح الضيف للحجز #${bookingId}. يلزم الاسترداد اليدوي عبر InstaPay.`,
              { bookingId },
            ),
          ),
        );
      } catch (e) {
        this.logger.error(`[refundBooking] Admin notification failed: ${(e as Error).message}`);
      }
    }

    // Notify the guest regardless of method
    await this.notificationsService.create(
      booking.guestId,
      'refund_initiated',
      'Refund Initiated',
      'تم بدء الاسترداد',
      `A refund of ${booking.currency ?? 'EGP'} ${refundAmount.toFixed(2)} has been initiated for booking #${bookingId}.`,
      `تم بدء استرداد ${booking.currency ?? 'EGP'} ${refundAmount.toFixed(2)} للحجز #${bookingId}.`,
      { bookingId },
    ).catch(() => {/* best-effort */});
  }

  private async unblockDates(propertyId: number, checkIn: string, checkOut: string) {
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      await this.availabilityRepo.update(
        { propertyId, date },
        { isBlocked: false },
      );
    }
  }

  // ─── Security Deposit ────────────────────────────────────────────────────────

  async claimDeposit(bookingId: number, hostId: number, reason: string): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (booking.hostId !== hostId) throw new ForbiddenException('Not your booking');
    if (booking.depositStatus !== 'held') throw new BadRequestException('No deposit available to claim');
    if (booking.status !== 'completed') {
      throw new BadRequestException('Deposit can only be claimed after checkout is complete');
    }
    if (booking.depositClaimDeadline && new Date() > booking.depositClaimDeadline) {
      throw new BadRequestException('Deposit claim window has expired (48 h after checkout)');
    }
    if (!reason?.trim()) throw new BadRequestException('Claim reason is required');
    booking.depositStatus = 'claimed';
    booking.depositClaimReason = reason;
    return this.bookingsRepo.save(booking);
  }

  async releaseDeposit(bookingId: number): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (booking.depositStatus !== 'held' && booking.depositStatus !== 'claimed') {
      throw new BadRequestException('Deposit is not in a releasable state');
    }
    booking.depositStatus = 'released';
    booking.depositReleasedAt = new Date();
    return this.bookingsRepo.save(booking);
  }
}
