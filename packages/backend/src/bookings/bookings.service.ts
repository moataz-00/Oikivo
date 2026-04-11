import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThanOrEqual, In, LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingEntity } from '../entities/booking.entity';
import { PropertyEntity } from '../entities/property.entity';
import { UserEntity } from '../entities/user.entity';
import { AvailabilityEntity } from '../entities/availability.entity';
import { EarningEntity } from '../entities/earning.entity';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplBookingRequestReceived, tplBookingRequestSubmitted, tplBookingConfirmed, tplBookingAccepted, tplBookingCancelled, tplInstapayPaymentConfirmed, tplInstapayPaymentDeclined, tplRefundNotification, tplInstapayRefundPending, tplInstapayRefundCompleted, tplHostCancelledRebooking } from '../mail/mail.service';
import { CoHostEntity } from '../entities/cohost.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaymentsService } from '../payments/payments.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrencyService } from '../common/currency.service';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { startOfDay } from 'date-fns';
import { isEgyptianPublicHoliday } from '../common/holidays.util';

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
    private currencyService: CurrencyService,
    private dataSource: DataSource,
  ) {
    // FIX BUG-GC2: Fail fast in production if Stripe key is missing
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (!secretKey && nodeEnv === 'production') {
      throw new Error('STRIPE_SECRET_KEY is required in production mode');
    }
    this.stripe = new Stripe(secretKey ?? 'sk_test_placeholder', {
      apiVersion: '2024-04-10' as any,
    });
  }

  /** Egyptian holiday check — delegated to shared util. */
  private isEgyptianPublicHolidayCheck(d: Date): boolean {
    return isEgyptianPublicHoliday(d);
  }

  async create(guestId: number, dto: CreateBookingDto): Promise<BookingEntity> {
    // FIX BUG-GC1: Prevent abuse - limit concurrent active bookings per guest
    const MAX_CONCURRENT_BOOKINGS = 10;
    const activeBookingsCount = await this.bookingsRepo.count({
      where: {
        guestId,
        status: In(['pending', 'confirmed', 'in_progress'] as any),
      },
    });
    if (activeBookingsCount >= MAX_CONCURRENT_BOOKINGS) {
      throw new BadRequestException(
        `You have reached the maximum of ${MAX_CONCURRENT_BOOKINGS} active bookings. Please complete or cancel existing bookings before creating new ones.`,
      );
    }

    // Idempotency: return existing booking if same guest/property/dates within 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const existing = await this.bookingsRepo.findOne({
      where: {
        guestId,
        propertyId: dto.propertyId,
        checkIn: dto.checkIn,
        checkOut: dto.checkOut,
        createdAt: MoreThanOrEqual(fifteenMinsAgo),
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

    // H4: Host requires only verified guests
    if (property.requireVerifiedGuest && !guest.isIdVerified) {
      throw new ForbiddenException(
        'This property only accepts bookings from ID-verified guests. Please complete identity verification first.',
      );
    }

    // H5: Host requires minimum guest rating
    if (property.minGuestRating != null) {
      const guestAvg = await this.bookingsRepo
        .createQueryBuilder('b')
        .innerJoin('b.review', 'r')
        .select('AVG(r.rating)', 'avg')
        .where('b.guestId = :guestId', { guestId })
        .getRawOne();
      const avgRating = guestAvg?.avg ? parseFloat(guestAvg.avg) : null;
      if (avgRating !== null && avgRating < Number(property.minGuestRating)) {
        throw new ForbiddenException(
          `This property requires a minimum guest rating of ${property.minGuestRating}. Your current rating is ${avgRating.toFixed(1)}.`,
        );
      }
    }

    // No listing-type validation needed (all listings are short-term)

    const checkInDate = new Date(dto.checkIn);
    const checkOutDate = new Date(dto.checkOut);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Limit future bookings to 12 months
    const maxFutureDate = new Date(today);
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (checkInDate >= maxFutureDate) {
      throw new BadRequestException('Bookings cannot be made more than 12 months in advance');
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
      const isPeak = isWeekend || this.isEgyptianPublicHolidayCheck(d);
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
      displayCurrency: dto.displayCurrency || null,
      status,
      confirmedAt: effectiveInstantBook ? new Date() : null,
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

    // Send email to host (always in property currency)
    try {
      const feBase = this.getFrontendBaseUrl();
      const reservationsUrl = `${feBase}/en/hosting/reservations`;
      await this.mail.send(
        property.host.email,
        'New booking request — Oikivo',
        tplBookingRequestReceived(
          property.host.firstName,
          guest.firstName,
          property.title,
          saved.checkIn,
          saved.checkOut,
          saved.guestsCount,
          this.currencyService.formatForEmail(Number(saved.totalAmount), saved.currency ?? 'EGP'),
          '',
          reservationsUrl,
          saved.specialRequests,
        ),
      );
    } catch (e) {
      this.logger.error(`Failed to send booking request email: ${(e as Error).message}`);
    }

    // Send acknowledgment/confirmation email to guest (in guest's display currency)
    try {
      const feBase = this.getFrontendBaseUrl();
      const tripsUrl = `${feBase}/en/trips`;
      const guestAmount = this.currencyService.convertAndFormat(
        Number(saved.totalAmount), saved.currency ?? 'EGP', saved.displayCurrency,
      );
      if (property.instantBook) {
        // Instant-book: booking is confirmed — please pay now
        await this.mail.send(
          guest.email,
          'Your booking is confirmed — please complete payment — Oikivo',
          tplBookingAccepted(
            guest.firstName,
            property.title,
            saved.checkIn,
            saved.checkOut,
            saved.guestsCount,
            guestAmount,
            '',
            `#${saved.id}`,
            tripsUrl,
          ),
        );
      } else {
        // Normal flow: booking is pending host approval — send request submitted email
        await this.mail.send(
          guest.email,
          'Booking request received — Oikivo',
          tplBookingRequestSubmitted(
            guest.firstName,
            property.title,
            saved.checkIn,
            saved.checkOut,
            saved.guestsCount,
            guestAmount,
            '',
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

    await this.dataSource.transaction(async (manager) => {
      const txBookingsRepo = manager.getRepository(BookingEntity);
      const txPropertiesRepo = manager.getRepository(PropertyEntity);
      const txAvailabilityRepo = manager.getRepository(AvailabilityEntity);

      const bookingForUpdate = await txBookingsRepo
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.property', 'property')
        .leftJoinAndSelect('b.guest', 'guest')
        .where('b.id = :id', { id: bookingId })
        .setLock('pessimistic_write')
        .getOne();

      if (!bookingForUpdate) throw new NotFoundException('Booking not found');
      if (bookingForUpdate.hostId !== hostId) throw new ForbiddenException('Not your booking');
      if (bookingForUpdate.status !== 'pending') {
        throw new BadRequestException('Booking is not in pending state');
      }

      const overlapping = await txBookingsRepo
        .createQueryBuilder('b')
        .where('b.property_id = :propertyId', { propertyId: bookingForUpdate.propertyId })
        .andWhere('b.id != :bookingId', { bookingId })
        .andWhere('b.status IN (:...statuses)', { statuses: ['pending', 'confirmed', 'in_progress'] })
        .andWhere('b.check_in < :checkOut', { checkOut: bookingForUpdate.checkOut })
        .andWhere('b.check_out > :checkIn', { checkIn: bookingForUpdate.checkIn })
        .setLock('pessimistic_write')
        .getMany();

      const hardConflict = overlapping.some((b) => b.status === 'confirmed' || b.status === 'in_progress');
      if (hardConflict) {
        throw new ConflictException('Dates are no longer available for this booking.');
      }

      await txBookingsRepo.update(bookingId, { status: 'confirmed', confirmedAt: new Date() } as any);

      const pendingToReject = overlapping.filter((b) => b.status === 'pending').map((b) => b.id);
      if (pendingToReject.length > 0) {
        await txBookingsRepo
          .createQueryBuilder()
          .update(BookingEntity)
          .set({
            status: 'declined',
            cancellationReason: 'Auto-declined: another overlapping booking was confirmed first.',
          } as any)
          .whereInIds(pendingToReject)
          .execute();
      }

      const prop = await txPropertiesRepo.findOne({ where: { id: bookingForUpdate.propertyId } });
      if (prop && prop.bookingMode === 'approve_first_three') {
        const nextApprovedCount = Math.min(3, Number(prop.approvedBookingsCount ?? 0) + 1);
        const graduationUpdate = nextApprovedCount >= 3
          ? { approvedBookingsCount: nextApprovedCount, bookingMode: 'instant_book', instantBook: true }
          : { approvedBookingsCount: nextApprovedCount };
        await txPropertiesRepo.update({ id: bookingForUpdate.propertyId }, graduationUpdate as any);
      }

      const checkInDate = new Date(bookingForUpdate.checkIn);
      const checkOutDate = new Date(bookingForUpdate.checkOut);
      for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
        const date = d.toISOString().split('T')[0];
        let av = await txAvailabilityRepo.findOne({ where: { propertyId: bookingForUpdate.propertyId, date } });
        if (av) {
          av.isBlocked = true;
          av.source = 'booking';
        } else {
          av = txAvailabilityRepo.create({
            propertyId: bookingForUpdate.propertyId,
            date,
            isBlocked: true,
            source: 'booking',
          });
        }
        await txAvailabilityRepo.save(av);
      }
    });

    await this.notificationsService.create(
      booking.guestId,
      'booking_confirmed',
      'Booking Confirmed',
      'تم تأكيد الحجز',
      `Your booking has been confirmed`,
      `تم تأكيد حجزك`,
      { bookingId },
    );

    // H9: update host response metrics
    this.updateHostResponseMetrics(hostId, booking.createdAt).catch(() => {});

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

    // Send acceptance + pay-now email to guest (Issue #1 fix)
    try {
      const feBase = this.getFrontendBaseUrl();
      const tripsUrl = `${feBase}/en/trips`;
      const guestAmount = this.currencyService.convertAndFormat(
        Number(booking.totalAmount), booking.currency ?? 'EGP', booking.displayCurrency,
      );
      await this.mail.send(
        booking.guest.email,
        'Host accepted your booking — complete payment to lock in your stay — Oikivo',
        tplBookingAccepted(
          booking.guest.firstName,
          booking.property.title,
          booking.checkIn,
          booking.checkOut,
          booking.guestsCount,
          guestAmount,
          '',
          `#${bookingId}`,
          tripsUrl,
        ),
      );
    } catch (e) {
      this.logger.error(`Failed to send booking accepted email: ${(e as Error).message}`);
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

    // H9: update host response metrics
    this.updateHostResponseMetrics(hostId, booking.createdAt).catch(() => {});

    return this.findOne(bookingId);
  }

  /** H9: Recalculate and store host average response time & response rate */
  private async updateHostResponseMetrics(hostId: number, _bookingCreatedAt: Date): Promise<void> {
    try {
      const result = await this.dataSource.query(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status IN ('confirmed','declined') THEN 1 ELSE 0 END) AS responded,
           AVG(
             CASE WHEN status IN ('confirmed','declined')
             THEN TIMESTAMPDIFF(MINUTE, created_at, updated_at)
             ELSE NULL END
           ) AS avgMinutes,
           SUM(
             CASE WHEN status IN ('confirmed','declined')
               AND TIMESTAMPDIFF(HOUR, created_at, updated_at) <= 24
             THEN 1 ELSE 0 END
           ) AS within24h
         FROM bookings
         WHERE host_id = ? AND status IN ('pending','confirmed','declined','completed','in_progress','cancelled')`,
        [hostId],
      );
      const row = result[0];
      const responded = Number(row.responded ?? 0);
      const total = Number(row.total ?? 0);
      const avgMinutes = Math.round((Number(row.avgMinutes ?? 0)) * 10) / 10;
      const responseRate = total > 0 ? Math.round((Number(row.within24h ?? 0) / total) * 10000) / 100 : 100;

      await this.usersRepo.update(hostId, {
        averageResponseMinutes: avgMinutes,
        responseRate,
      });
    } catch (e) {
      this.logger.error(`Failed to update response metrics for host ${hostId}: ${(e as Error).message}`);
    }
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
    // FIX BUG-GM2: Use timezone-aware comparison
    if (cancelledBy === 'guest') {
      const propertyTimezone = booking.property?.timezone || null;
      const checkInDate = new Date(booking.checkIn);
      const daysUntilCheckIn = this.calculateDaysUntilCheckIn(checkInDate, propertyTimezone);
      
      if (daysUntilCheckIn <= 0) {
        throw new BadRequestException('Cancellations are not allowed on or after the check-in date');
      }
    }

    // 5.2 — For in-progress bookings cancelled by the host, prorate based on nights delivered
    const refundInfo = (booking.status === 'in_progress' && cancelledBy === 'host')
      ? this.calculateProratedRefund(booking)
      : this.calculateRefund(booking, cancelledBy);

    // If paid via Stripe, trigger automatic refund before updating DB status
    let stripeRefundTriggered = false;
    let stripeRefundFailed = false; // FIX BUG-GH2: Track refund failures
    if (booking.stripePaymentIntentId && booking.paymentStatus === 'paid' && refundInfo.refundAmount > 0) {
      try {
        const currency = (booking.currency ?? 'EGP').toLowerCase();
        const refundAmountSmallest = this.currencyService.toSmallestUnit(refundInfo.refundAmount, currency);
        await this.stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          amount: refundAmountSmallest,
        });
        stripeRefundTriggered = true;
      } catch (err) {
        this.logger.error(`Stripe refund failed for booking #${bookingId}: ${(err as Error).message}`);
        stripeRefundFailed = true; // FIX BUG-GH2: Mark refund as failed
      }
    }

    // If paid via OPay, trigger OPay refund before updating DB status
    let opayRefundTriggered = false;
    let opayRefundFailed = false;
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
        opayRefundFailed = true;
      }
    }

    // Only mark as refunded when an automated refund was actually triggered and confirmed.
    // InstaPay refunds are manual — keep paymentStatus as 'paid' so admin knows to act.
    // If Stripe/OPay API call failed (opayRefundTriggered/stripeRefundTriggered still false),
    // also keep 'paid' so admin can retry rather than falsely marking it refunded.
    const needsManualRefundQueue =
      booking.paymentStatus === 'paid' &&
      refundInfo.refundAmount > 0 &&
      (stripeRefundFailed || opayRefundFailed);

    const newPaymentStatus = needsManualRefundQueue
      ? 'refund_pending'
      : (stripeRefundTriggered || opayRefundTriggered)
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

    if (needsManualRefundQueue) {
      try {
        const admins = await this.usersRepo.find({ where: { isAdmin: true, isActive: true } });
        await Promise.all(
          admins.map((admin) =>
            this.notificationsService.create(
              admin.id,
              'refund_pending',
              'Refund Requires Manual Action',
              'الاسترداد يحتاج تدخل يدوي',
              `Refund for booking #${bookingId} could not be completed automatically. Amount: ${(booking.currency ?? 'EGP')} ${refundInfo.refundAmount.toFixed(2)}.`,
              `تعذر إتمام استرداد الحجز #${bookingId} تلقائياً. المبلغ: ${(booking.currency ?? 'EGP')} ${refundInfo.refundAmount.toFixed(2)}.`,
              { bookingId },
            ),
          ),
        );
      } catch (e) {
        this.logger.error(`Failed to notify admins about refund pending for booking #${bookingId}: ${(e as Error).message}`);
      }
    }

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
      const feBase = this.getFrontendBaseUrl();
      const curr = booking.currency ?? 'EGP';
      const ref = `#${bookingId}`;
      const refundStr = refundInfo.refundAmount > 0
        ? this.currencyService.convertAndFormat(refundInfo.refundAmount, curr, booking.displayCurrency)
        : undefined;
      const selfUser = cancelledBy === 'guest' ? booking.guest : booking.host;
      const otherRole: 'guest' | 'host' = cancelledBy === 'guest' ? 'host' : 'guest';
      const otherUser = cancelledBy === 'guest' ? booking.host : booking.guest;
      await this.mail.send(
        selfUser.email,
        'Booking cancelled — Oikivo',
        tplBookingCancelled(selfUser.firstName, cancelledBy, booking.property.title, booking.checkIn, booking.checkOut, ref, refundStr, ''),
      );
      await this.mail.send(
        otherUser.email,
        'Booking cancelled — Oikivo',
        tplBookingCancelled(otherUser.firstName, otherRole, booking.property.title, booking.checkIn, booking.checkOut, ref),
      );
    } catch (e) {
      this.logger.error(`Failed to send cancellation emails: ${(e as Error).message}`);
    }

    // If Stripe refund was triggered, send a dedicated refund notification to the guest
    if (stripeRefundTriggered && cancelledBy === 'guest') {
      try {
        const feBase = this.getFrontendBaseUrl();
        const tripsUrl = `${feBase}/en/trips`;
        const refundDisplay = this.currencyService.convertAndFormat(
          refundInfo.refundAmount, booking.currency ?? 'EGP', booking.displayCurrency,
        );
        await this.mail.send(
          booking.guest.email,
          'Your Stripe refund is being processed — Oikivo',
          tplRefundNotification(
            booking.guest.firstName,
            refundDisplay,
            '',
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
        const feBase = this.getFrontendBaseUrl();
        const tripsUrl = `${feBase}/en/trips`;
        const refundDisplay = this.currencyService.convertAndFormat(
          refundInfo.refundAmount, booking.currency ?? 'EGP', booking.displayCurrency,
        );
        await this.mail.send(
          booking.guest.email,
          'Your OPay refund is being processed — Oikivo',
          tplRefundNotification(
            booking.guest.firstName,
            refundDisplay,
            '',
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
        const feBase = this.getFrontendBaseUrl();
        const tripsUrl = `${feBase}/en/trips`;
        const refundDisplay = this.currencyService.convertAndFormat(
          refundInfo.refundAmount, booking.currency ?? 'EGP', booking.displayCurrency,
        );
        await this.mail.send(
          booking.guest.email,
          'Your InstaPay refund is being arranged — Oikivo',
          tplInstapayRefundPending(
            booking.guest.firstName,
            booking.property.title,
            refundDisplay,
            '',
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
      // HM1: Host cancellation penalty tracking
      try {
        const host = await this.usersRepo.findOne({ where: { id: booking.hostId } });
        if (host) {
          const nextCount = Number((host as any).hostCancelledBookingsCount ?? 0) + 1;
          await this.usersRepo.update(host.id, {
            hostCancelledBookingsCount: nextCount,
            lastHostCancellationAt: new Date(),
            isSuperhost: false,
          } as any);

          if (nextCount === 3) {
            await this.notificationsService.create(
              host.id,
              'host_penalty_warning',
              'Cancellation Warning',
              'تحذير بسبب الإلغاء',
              'You have reached 3 host-initiated cancellations. Further cancellations may affect account standing.',
              'لقد وصلت إلى 3 إلغاءات من جانب المضيف. الإلغاءات الإضافية قد تؤثر على حالة الحساب.',
              { hostCancelledBookingsCount: nextCount },
            );
          }

          if (nextCount >= 5) {
            await this.notificationsService.create(
              host.id,
              'host_penalty_escalation',
              'Account Review Triggered',
              'تم تصعيد مراجعة الحساب',
              'Your account has reached 5 host-initiated cancellations and is now under review.',
              'وصل حسابك إلى 5 إلغاءات من جانب المضيف وهو الآن قيد المراجعة.',
              { hostCancelledBookingsCount: nextCount },
            );
          }

          if (nextCount >= 8) {
            await this.notificationsService.create(
              host.id,
              'host_penalty_suspension',
              'Publishing Restricted',
              'تقييد النشر',
              'Your account reached the cancellation suspension threshold. New listing publishing is temporarily restricted pending review.',
              'وصل حسابك لحد التعليق بسبب الإلغاءات. تم تقييد نشر القوائم الجديدة مؤقتًا لحين المراجعة.',
              { hostCancelledBookingsCount: nextCount },
            );
          }

          // Apply search demotion by reducing listing impression weight after host-initiated cancellations.
          await this.propertiesRepo
            .createQueryBuilder()
            .update(PropertyEntity)
            .set({ impressionCount: () => 'GREATEST(FLOOR(impression_count * 0.7), 0)' })
            .where('host_id = :hostId', { hostId: host.id })
            .execute();
        }
      } catch (e) {
        this.logger.error(`Failed to apply host cancellation penalty for booking #${bookingId}: ${(e as Error).message}`);
      }

      try {
        const feBase = this.getFrontendBaseUrl();
        const propertyUrl = `${feBase}/en/properties/${booking.propertyId}`;
        await this.mail.send(
          booking.guest.email,
          `Your stay at ${booking.property.title} was cancelled — Oikivo`,
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

  async getCancellationPreview(bookingId: number, userId: number) {
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

  /**
   * Calculate days until check-in using property's timezone.
   * Fixes BUG-GM2: Cancellation Timezone Sensitivity
   */
  private calculateDaysUntilCheckIn(checkInDate: Date, propertyTimezone: string | null): number {
    // Default to UTC/server time if no timezone specified
    const timezone = propertyTimezone || 'UTC';
    
    // Get current date/time in the property's timezone
    const nowInPropertyTz = toZonedTime(new Date(), timezone);
    const todayInPropertyTz = startOfDay(nowInPropertyTz);
    
    // Convert check-in date to property timezone
    const checkInInPropertyTz = toZonedTime(checkInDate, timezone);
    const checkInDayInPropertyTz = startOfDay(checkInInPropertyTz);
    
    // Calculate difference in days
    const daysUntilCheckIn = Math.ceil(
      (checkInDayInPropertyTz.getTime() - todayInPropertyTz.getTime()) / (1000 * 60 * 60 * 24),
    );
    
    return daysUntilCheckIn;
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

    // FIX BUG-GM2: Use timezone-aware calculation for accurate cancellation policy enforcement
    const propertyTimezone = booking.property?.timezone || null;
    const checkInDate = new Date(booking.checkIn);
    const daysUntilCheckIn = this.calculateDaysUntilCheckIn(checkInDate, propertyTimezone);

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

    // FIX BUG-GH5: Validate InstaPay reference format
    if (dto.method === 'instapay' && dto.reference) {
      const cleanRef = dto.reference.trim();
      if (cleanRef.length < 6 || cleanRef.length > 30) {
        throw new BadRequestException('InstaPay reference must be between 6 and 30 characters');
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(cleanRef)) {
        throw new BadRequestException('InstaPay reference must contain only alphanumeric characters, hyphens, and underscores');
      }
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
    if (booking.paymentMethod === 'instapay' && !isAdmin) {
      throw new ForbiddenException('InstaPay verification is admin-only');
    }
    if (!isAdmin && booking.hostId !== userId) {
      throw new ForbiddenException('Only the host or an admin can confirm payment');
    }
    await this.bookingsRepo.update(bookingId, {
      paymentStatus: 'paid',
      status: booking.status === 'pending' ? 'confirmed' : booking.status,
    });

    // Issue #5 fix — create EarningEntity for InstaPay confirmed payments
    try {
      const existingEarning = await this.earningsRepo.findOne({ where: { bookingId } });
      if (!existingEarning) {
        const totalAmount = Number(booking.totalAmount);
        const serviceFee = Number(booking.serviceFee);
        const checkOutDate = new Date(booking.checkOut);
        const availableAt = new Date(checkOutDate);
        availableAt.setDate(availableAt.getDate() + 1);
        await this.earningsRepo.save(
          this.earningsRepo.create({
            hostId: booking.hostId,
            bookingId,
            amount: parseFloat((totalAmount - serviceFee).toFixed(2)),
            platformFee: serviceFee,
            currency: booking.currency ?? 'EGP',
            status: new Date() >= availableAt ? 'available' : 'pending',
            availableAt,
          }),
        );
      }
    } catch (e) {
      this.logger.error(`[confirmPayment] Failed to create EarningEntity for booking #${bookingId}: ${(e as Error).message}`);
    }

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
      const feBase = this.getFrontendBaseUrl();
      const tripsUrl = `${feBase}/en/trips`;
      const guestAmount = this.currencyService.convertAndFormat(
        Number(booking.totalAmount), booking.currency ?? 'EGP', booking.displayCurrency,
      );
      await this.mail.send(
        booking.guest.email,
        'Your InstaPay payment is confirmed — Oikivo',
        tplInstapayPaymentConfirmed(
          booking.guest.firstName,
          `#${bookingId}`,
          booking.property.title,
          booking.checkIn,
          booking.checkOut,
          guestAmount,
          '',
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
    if (booking.paymentMethod === 'instapay' && !isAdmin) {
      throw new ForbiddenException('InstaPay verification is admin-only');
    }
    if (!isAdmin && booking.hostId !== userId) {
      throw new ForbiddenException('Only the host or an admin can decline payment');
    }
    if (booking.paymentStatus !== 'submitted') {
      throw new BadRequestException('Payment is not in submitted state');
    }

    const nextStatus = booking.status === 'confirmed' ? 'pending' : booking.status;
    await this.bookingsRepo.update(bookingId, {
      paymentStatus: 'declined' as any,
      status: nextStatus as any,
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
      const feBase = this.getFrontendBaseUrl();
      const tripsUrl = `${feBase}/en/trips`;
      await this.mail.send(
        booking.guest.email,
        'Payment could not be verified — Oikivo',
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

  async updateHostNotes(
    bookingId: number,
    hostId: number,
    body: { hostNote?: string; hostCheckInInstructions?: string },
  ): Promise<BookingEntity> {
    const booking = await this.findOne(bookingId);
    if (booking.hostId !== hostId) throw new ForbiddenException('Not your booking');
    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      throw new BadRequestException('Host notes can only be updated for confirmed or in-progress bookings');
    }

    await this.bookingsRepo.update(bookingId, {
      hostNote: body.hostNote ?? null,
      hostCheckInInstructions: body.hostCheckInInstructions ?? null,
    } as any);

    await this.notificationsService.create(
      booking.guestId,
      'booking_host_note_updated',
      'Host updated your stay details',
      'قام المضيف بتحديث تفاصيل إقامتك',
      `Your host updated notes/check-in details for booking #${bookingId}.`,
      `قام المضيف بتحديث الملاحظات/تفاصيل تسجيل الوصول للحجز #${bookingId}.`,
      { bookingId },
    ).catch(() => {});

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
      const feBase = this.getFrontendBaseUrl();
      const tripsUrl = `${feBase}/en/trips`;
      const refundRaw = booking.refundAmount != null ? Number(booking.refundAmount) : Number(booking.totalAmount);
      const refundDisplay = this.currencyService.convertAndFormat(
        refundRaw, booking.currency ?? 'EGP', booking.displayCurrency,
      );
      await this.mail.send(
        booking.guest.email,
        'Your InstaPay refund has been sent — Oikivo',
        tplInstapayRefundCompleted(
          booking.guest.firstName,
          booking.property.title,
          refundDisplay,
          '',
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

  /** G11: Guest payment history — all bookings with payment info */
  async getGuestPaymentHistory(guestId: number) {
    return this.bookingsRepo.find({
      where: { guestId },
      select: [
        'id', 'bookingUuid', 'checkIn', 'checkOut', 'guestsCount',
        'baseAmount', 'serviceFee', 'cleaningFee', 'totalAmount',
        'depositAmount', 'currency', 'status', 'paymentStatus',
        'paymentMethod', 'paymentReference', 'createdAt',
        'refundAmount', 'cancelledAt',
      ],
      relations: ['property'],
      order: { createdAt: 'DESC' },
      take: 200,
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
    const host = await this.usersRepo.findOne({ where: { id: hostId } });
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
    let responseTimeCount = 0;
    let responseTimeTotalMinutes = 0;

    for (const b of allBookings) {
      byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
      if (b.status === 'confirmed' || b.status === 'declined') {
        const diffMs = new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime();
        if (diffMs >= 0) {
          responseTimeCount += 1;
          responseTimeTotalMinutes += diffMs / (1000 * 60);
        }
      }
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
      select: ['id', 'city', 'viewCount', 'impressionCount', 'avgRating', 'reviewCount'],
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
      avgRating?: number; reviewCount?: number;
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
          avgRating: Number((b.property as any).avgRating ?? 0),
          reviewCount: Number((b.property as any).reviewCount ?? 0),
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
    const avgResponseMinutes = responseTimeCount > 0
      ? Math.round((responseTimeTotalMinutes / responseTimeCount) * 10) / 10
      : 0;

    const satisfactionRows: Array<{ month: string; avgRating: number; reviewCount: number }> =
      await this.dataSource.query(
        `
          SELECT DATE_FORMAT(r.created_at, '%Y-%m') AS month,
                 ROUND(AVG(r.rating), 2) AS avgRating,
                 COUNT(*) AS reviewCount
          FROM reviews r
          INNER JOIN bookings b ON b.id = r.booking_id
          WHERE b.host_id = ?
          GROUP BY DATE_FORMAT(r.created_at, '%Y-%m')
          ORDER BY month DESC
          LIMIT 6
        `,
        [hostId],
      );

    const hostCities = Array.from(new Set(hostProperties.map((p: any) => p.city).filter(Boolean)));
    let areaAverages: Array<{ city: string; areaAvgRating: number; areaAvgPrice: number }> = [];
    if (hostCities.length) {
      const placeholders = hostCities.map(() => '?').join(',');
      areaAverages = await this.dataSource.query(
        `
          SELECT city,
                 ROUND(AVG(avg_rating), 2) AS areaAvgRating,
                 ROUND(AVG(price_per_night), 2) AS areaAvgPrice
          FROM properties
          WHERE city IN (${placeholders}) AND status = 'published'
          GROUP BY city
        `,
        hostCities,
      );
    }

    const cancellationCount = Number((host as any)?.hostCancelledBookingsCount ?? 0);
    const penaltyTier = cancellationCount >= 8
      ? 'suspended'
      : cancellationCount >= 5
      ? 'review'
      : cancellationCount >= 3
      ? 'warning'
      : 'good';

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
        avgResponseMinutes,
        thisMonthBookings: thisMonth.bookings,
        thisMonthRevenue: thisMonth.revenue,
      },
      hostPenalty: {
        cancellationCount,
        lastCancellationAt: (host as any)?.lastHostCancellationAt ?? null,
        tier: penaltyTier,
      },
      satisfaction: satisfactionRows.reverse().map((r) => ({
        month: r.month,
        avgRating: Number(r.avgRating ?? 0),
        reviewCount: Number(r.reviewCount ?? 0),
      })),
      areaBenchmarks: areaAverages,
      monthly: Object.entries(monthly).map(([month, data]) => ({ month, ...data })),
      byProperty: Object.values(byPropertyMap).sort((a, b) => b.revenue - a.revenue),
    };
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
        const feBase = this.getFrontendBaseUrl();
        const tripsUrl = `${feBase}/en/trips`;
        await this.mail.send(
          booking.guest.email,
          'Your InstaPay refund is being arranged — Oikivo',
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

  /** FE-12: Single source of truth for FRONTEND_URL resolution */
  private getFrontendBaseUrl(): string {
    const raw = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return (raw.split(',')[0]?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
  }

  /** H13: Revenue forecast based on upcoming bookings + historical occupancy */
  async getRevenueForecast(hostId: number) {
    const now = new Date();
    const horizonDays = 90;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + horizonDays);
    const startStr = now.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Confirmed upcoming bookings
    const upcoming = await this.bookingsRepo.find({
      where: {
        hostId,
        status: In(['confirmed', 'in_progress'] as any),
        checkIn: LessThanOrEqual(endStr) as any,
      },
      select: ['id', 'propertyId', 'checkIn', 'checkOut', 'totalAmount', 'serviceFee', 'nights'],
    });

    let confirmedRevenue = 0;
    let confirmedNights = 0;
    for (const b of upcoming) {
      if (new Date(b.checkOut) > now) {
        confirmedRevenue += Number(b.totalAmount ?? 0) - Number(b.serviceFee ?? 0);
        confirmedNights += Number(b.nights ?? 0);
      }
    }

    // Historical occupancy rate (last 90 days)
    const past90 = new Date(now);
    past90.setDate(past90.getDate() - 90);
    const pastStr = past90.toISOString().split('T')[0];
    const histResult = await this.dataSource.query(
      `SELECT COUNT(*) as totalBookings,
              SUM(nights) as totalNights,
              AVG(total_amount - service_fee) as avgRevPerBooking
       FROM bookings
       WHERE host_id = ? AND status IN ('completed','confirmed','in_progress')
         AND check_in >= ?`,
      [hostId, pastStr],
    );
    const hist = histResult[0] ?? {};
    const historicalAvgNights = Number(hist.totalNights ?? 0);
    const historicalAvgRev = Number(hist.avgRevPerBooking ?? 0);

    // Get total property count
    const propCount = await this.propertiesRepo.count({ where: { hostId, status: 'published' as any } });
    const totalAvailableNights = propCount * horizonDays;
    const historicalOccupancyRate = totalAvailableNights > 0 && historicalAvgNights > 0
      ? Math.min(1, historicalAvgNights / totalAvailableNights)
      : 0;

    // Projected: confirmed + estimated from unbooked nights
    const unbookedNights = Math.max(0, totalAvailableNights - confirmedNights);
    const projectedAdditionalBookings = Math.round(unbookedNights * historicalOccupancyRate);
    const projectedAdditionalRevenue = projectedAdditionalBookings * historicalAvgRev;

    // Monthly breakdown
    const forecastMonths: Array<{ month: string; confirmed: number; projected: number }> = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthStart = d;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const monthConfirmed = upcoming
        .filter((b) => {
          const ci = new Date(b.checkIn);
          return ci >= monthStart && ci <= monthEnd;
        })
        .reduce((sum, b) => sum + Number(b.totalAmount ?? 0) - Number(b.serviceFee ?? 0), 0);

      const daysInMonth = monthEnd.getDate();
      const monthProjected = Math.round(propCount * daysInMonth * historicalOccupancyRate * historicalAvgRev / (Number(hist.totalNights ?? 1) || 1));

      forecastMonths.push({
        month: key,
        confirmed: Math.round(monthConfirmed),
        projected: Math.max(Math.round(monthProjected), Math.round(monthConfirmed)),
      });
    }

    return {
      horizonDays,
      confirmedRevenue: Math.round(confirmedRevenue),
      confirmedNights,
      projectedTotalRevenue: Math.round(confirmedRevenue + projectedAdditionalRevenue),
      historicalOccupancyRate: Math.round(historicalOccupancyRate * 100),
      totalProperties: propCount,
      forecastMonths,
    };
  }

  /** H12: Market benchmarking insights for host */
  async getMarketInsights(hostId: number) {
    const properties = await this.propertiesRepo.find({
      where: { hostId, status: 'published' as any },
      select: ['id', 'title', 'city', 'pricePerNight', 'avgRating', 'reviewCount', 'viewCount'],
    });
    if (!properties.length) return { insights: [], properties: [] };

    const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))];
    if (!cities.length) return { insights: [], properties: [] };

    const placeholders = cities.map(() => '?').join(',');
    const marketData: Array<{ city: string; avgPrice: number; avgRating: number; avgReviews: number; totalListings: number }> =
      await this.dataSource.query(
        `SELECT city,
                ROUND(AVG(price_per_night), 2) AS avgPrice,
                ROUND(AVG(avg_rating), 2) AS avgRating,
                ROUND(AVG(review_count), 1) AS avgReviews,
                COUNT(*) AS totalListings
         FROM properties
         WHERE city IN (${placeholders}) AND status = 'published'
         GROUP BY city`,
        cities,
      );

    const marketByCity = Object.fromEntries(marketData.map((m) => [m.city, m]));

    const propertyInsights = properties.map((p) => {
      const market = marketByCity[p.city];
      if (!market) return { propertyId: p.id, title: p.title, city: p.city, tips: [] };

      const tips: string[] = [];
      const price = Number(p.pricePerNight ?? 0);
      const mktPrice = Number(market.avgPrice ?? 0);

      if (mktPrice > 0 && price > 0) {
        const diff = Math.round(((price - mktPrice) / mktPrice) * 100);
        if (diff > 15) tips.push(`Your price is ${diff}% above similar listings in ${p.city}. Consider lowering it to attract more bookings.`);
        else if (diff < -15) tips.push(`Your price is ${Math.abs(diff)}% below the market average in ${p.city}. You could increase it.`);
      }

      const rating = Number(p.avgRating ?? 0);
      const mktRating = Number(market.avgRating ?? 0);
      if (rating > 0 && mktRating > 0 && rating < mktRating - 0.3) {
        tips.push(`Your rating (${rating.toFixed(1)}) is below the ${p.city} average (${mktRating.toFixed(1)}). Focus on guest experience to improve.`);
      }

      const reviews = Number(p.reviewCount ?? 0);
      const mktReviews = Number(market.avgReviews ?? 0);
      if (reviews < mktReviews * 0.5) {
        tips.push(`You have fewer reviews than average. Encourage guests to leave reviews after their stay.`);
      }

      return { propertyId: p.id, title: p.title, city: p.city, tips };
    });

    return {
      marketData: marketData.map((m) => ({
        city: m.city,
        avgPrice: Number(m.avgPrice),
        avgRating: Number(m.avgRating),
        avgReviews: Number(m.avgReviews),
        totalListings: Number(m.totalListings),
      })),
      properties: propertyInsights,
    };
  }

  /** H14: Ranking tips for a specific property */
  async getRankingTips(propertyId: number, hostId: number) {
    const property = await this.propertiesRepo.findOne({
      where: { id: propertyId, hostId },
      relations: ['photos', 'amenities'],
    });
    if (!property) throw new NotFoundException('Property not found');

    const tips: Array<{ category: string; priority: 'high' | 'medium' | 'low'; tip: string; current: string }> = [];

    // Photos
    const photoCount = (property as any).photos?.length ?? 0;
    if (photoCount < 5) {
      tips.push({ category: 'photos', priority: 'high', tip: 'Add more photos. Listings with 5+ photos get significantly more views.', current: `${photoCount} photos` });
    } else if (photoCount < 10) {
      tips.push({ category: 'photos', priority: 'medium', tip: 'Consider adding more photos (10+ recommended). Showcase different rooms and angles.', current: `${photoCount} photos` });
    }

    // Rating
    const rating = Number(property.avgRating ?? 0);
    const reviewCount = Number(property.reviewCount ?? 0);
    if (reviewCount === 0) {
      tips.push({ category: 'reviews', priority: 'high', tip: 'Get your first review! Great service leads to great reviews which boost your ranking.', current: 'No reviews yet' });
    } else if (rating < 4.0) {
      tips.push({ category: 'reviews', priority: 'high', tip: 'Focus on improving your guest experience. High ratings significantly boost search ranking.', current: `${rating.toFixed(1)} avg rating` });
    } else if (rating < 4.5) {
      tips.push({ category: 'reviews', priority: 'medium', tip: 'You\'re doing well! Small improvements in cleanliness and communication can push your rating higher.', current: `${rating.toFixed(1)} avg rating` });
    }

    // Response time
    const host = await this.usersRepo.findOne({ where: { id: hostId }, select: ['id', 'averageResponseMinutes', 'responseRate'] });
    const avgResponse = Number(host?.averageResponseMinutes ?? 0);
    const responseRate = Number(host?.responseRate ?? 100);
    if (avgResponse > 120) {
      tips.push({ category: 'response_time', priority: 'high', tip: 'Respond to booking requests faster. Hosts who respond within 1 hour rank higher.', current: `${Math.round(avgResponse)} min avg response` });
    } else if (avgResponse > 60) {
      tips.push({ category: 'response_time', priority: 'medium', tip: 'Great response time! Under 30 minutes is ideal for top ranking.', current: `${Math.round(avgResponse)} min avg response` });
    }
    if (responseRate < 90) {
      tips.push({ category: 'response_rate', priority: 'high', tip: 'Your response rate is below 90%. Respond to all booking requests within 24 hours.', current: `${responseRate}% response rate` });
    }

    // Price comparison with area
    const cityAvg = await this.dataSource.query(
      `SELECT ROUND(AVG(price_per_night), 2) as avgPrice FROM properties WHERE city = ? AND status = 'published' AND id != ?`,
      [property.city, propertyId],
    );
    const mktPrice = Number(cityAvg[0]?.avgPrice ?? 0);
    const price = Number(property.pricePerNight ?? 0);
    if (mktPrice > 0 && price > mktPrice * 1.3) {
      tips.push({ category: 'pricing', priority: 'medium', tip: `Your price (EGP ${price}) is significantly above the area average (EGP ${mktPrice}). Consider competitive pricing.`, current: `EGP ${price}/night` });
    }

    // Instant book
    if (!(property as any).instantBook) {
      tips.push({ category: 'instant_book', priority: 'low', tip: 'Enable Instant Book to appear higher in search results and attract more guests.', current: 'Manual approval' });
    }

    // Amenities
    const amenityCount = (property as any).amenities?.length ?? 0;
    if (amenityCount < 5) {
      tips.push({ category: 'amenities', priority: 'medium', tip: 'Add more amenities to your listing. Guests filter by amenities when searching.', current: `${amenityCount} amenities` });
    }

    return {
      propertyId,
      title: property.title,
      overallScore: Math.min(100, Math.max(0, 100 - tips.filter((t) => t.priority === 'high').length * 15 - tips.filter((t) => t.priority === 'medium').length * 8)),
      tips: tips.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }),
    };
  }
}
