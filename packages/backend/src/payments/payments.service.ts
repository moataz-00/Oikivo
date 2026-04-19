import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as https from 'https';
import * as crypto from 'crypto';
import Stripe from 'stripe';
import { BookingEntity } from '../entities/booking.entity';
import { ExperienceBookingEntity } from '../entities/experience-booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplPaymentInvoice, tplRefundNotification } from '../mail/mail.service';
import { CurrencyService } from '../common/currency.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  // ─── OPay config ───────────────────────────────────────────────────────────
  private readonly opayBaseUrl: string;
  private readonly opayMerchantId: string;
  private readonly opayPrivateKey: string;

  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingsRepo: Repository<BookingEntity>,

    @InjectRepository(ExperienceBookingEntity)
    private readonly expBookingsRepo: Repository<ExperienceBookingEntity>,

    @InjectRepository(EarningEntity)
    private readonly earningsRepo: Repository<EarningEntity>,

    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly currencyService: CurrencyService,
    private readonly auditLog: AuditLogService,
  ) {
    // FIX BUG-GC2: Fail fast in production if Stripe key is missing
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    if (!secretKey && nodeEnv === 'production') {
      throw new Error('STRIPE_SECRET_KEY is required in production mode');
    }
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY is not set — Stripe payments disabled.');
    }
    this.stripe = new Stripe(secretKey ?? 'sk_test_placeholder', {
      apiVersion: '2024-04-10' as any,
    });

    // OPay initialisation
    this.opayMerchantId = this.config.get<string>('OPAY_MERCHANT_ID') ?? '';
    this.opayPrivateKey = this.config.get<string>('OPAY_PRIVATE_KEY') ?? '';
    const opayEnv = this.config.get<string>('OPAY_ENV', 'sandbox');
    this.opayBaseUrl =
      opayEnv === 'production'
        ? 'https://api.opaycheckout.com'
        : 'https://sandboxapi.opaycheckout.com';
    if (!this.opayMerchantId || !this.opayPrivateKey) {
      this.logger.warn('OPAY_MERCHANT_ID or OPAY_PRIVATE_KEY not set — OPay payments disabled.');
    }
    // SEC: Fail fast in production if BACKEND_URL is not HTTPS
    const backendUrlCheck = this.config.get<string>('BACKEND_URL', '');
    if (nodeEnv === 'production' && backendUrlCheck && !backendUrlCheck.startsWith('https://')) {
      throw new Error(`BACKEND_URL must use https:// in production. Got: ${backendUrlCheck}`);
    }
  }

  // ─── Create PaymentIntent ──────────────────────────────────────────────────

  async createPaymentIntent(
    userId: number,
    bookingId: number,
    bookingType: 'stay' | 'experience',
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (bookingType === 'stay') {
      return this.createStayIntent(userId, bookingId);
    }
    return this.createExperienceIntent(userId, bookingId);
  }

  private async createStayIntent(userId: number, bookingId: number) {
    const booking = await this.bookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.guestId !== userId) throw new ForbiddenException('Not your booking');
    if (['cancelled', 'declined'].includes(booking.status)) {
      throw new BadRequestException('This booking can no longer be paid — it has been cancelled or declined');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('Booking is already paid');
    }

    // FIX BUG-GC3: Prevent duplicate PaymentIntents - return existing if already created
    if (booking.stripePaymentIntentId) {
      try {
        const existingIntent = await this.stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
        if (existingIntent && existingIntent.status !== 'canceled') {
          return {
            clientSecret: existingIntent.client_secret!,
            paymentIntentId: existingIntent.id,
          };
        }
      } catch (err) {
        this.logger.warn(`Could not retrieve existing PaymentIntent ${booking.stripePaymentIntentId}: ${(err as Error).message}`);
        // If intent doesn't exist or is invalid, create a new one below
      }
    }

    const currency = (booking.currency ?? 'EGP').toLowerCase();
    const amountInSmallestUnit = this.toSmallestUnit(Number(booking.totalAmount), currency);

    const intent = await this.stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency,
      metadata: { bookingId: String(bookingId), bookingType: 'stay', userId: String(userId) },
      // Restrict to card only — covers Visa, Mastercard, Apple Pay, Google Pay.
      // Excludes Cash App Pay, Amazon Pay, and other wallets.
      payment_method_types: ['card'],
    });

    await this.bookingsRepo.update(bookingId, {
      stripePaymentIntentId: intent.id,
      paymentMethod: 'stripe',
    });

    return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
  }

  private async createExperienceIntent(userId: number, bookingId: number) {
    const booking = await this.expBookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Experience booking not found');
    if (booking.guestId !== userId) throw new ForbiddenException('Not your booking');
    if (['cancelled', 'declined'].includes(booking.status)) {
      throw new BadRequestException('This booking can no longer be paid — it has been cancelled or declined');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('Booking is already paid');
    }

    const currency = 'EGP'.toLowerCase(); // experience bookings default to EGP
    const amountInSmallestUnit = this.toSmallestUnit(Number(booking.totalAmount), currency);

    const intent = await this.stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency,
      metadata: { bookingId: String(bookingId), bookingType: 'experience', userId: String(userId) },
      payment_method_types: ['card'],
    });

    await this.expBookingsRepo.update(bookingId, {
      stripePaymentIntentId: intent.id,
      paymentMethod: 'stripe',
    });

    return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
  }

  // ─── Refund ────────────────────────────────────────────────────────────────

  async refundBooking(
    userId: number,
    bookingId: number,
    bookingType: 'stay' | 'experience',
    reason?: string,
  ): Promise<{ refundId: string }> {
    if (bookingType === 'stay') {
      return this.refundStayBooking(userId, bookingId, reason);
    }
    return this.refundExperienceBooking(userId, bookingId, reason);
  }

  private async refundStayBooking(userId: number, bookingId: number, reason?: string) {
    const booking = await this.bookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    // FIX P4: Only the guest who made the payment can request a Stripe refund — hosts must go through admin/cancellation flow
    if (booking.guestId !== userId) {
      throw new ForbiddenException('Only the guest who made the payment can request a refund');
    }
    if (!booking.stripePaymentIntentId) {
      throw new BadRequestException('No Stripe payment found for this booking');
    }
    if (booking.paymentStatus !== 'paid') {
      throw new BadRequestException('Booking has not been paid via Stripe');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: booking.refundAmount
        ? this.toSmallestUnit(Number(booking.refundAmount), (booking.currency ?? 'EGP').toLowerCase())
        : undefined, // undefined = full refund
    });

    await this.bookingsRepo.update(bookingId, {
      paymentStatus: 'refunded',
      refundReason: reason ?? null,
      stripeRefundId: refund.id, // Persist refund ID for reconciliation
    } as any);

    // Send refund notification email
    try {
      const bookingWithGuest = await this.bookingsRepo.findOne({ where: { id: bookingId }, relations: ['guest', 'property'] });
      if (bookingWithGuest?.guest) {
        const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
        await this.mail.send(
          bookingWithGuest.guest.email,
          'Your refund is being processed — Oikivo',
          tplRefundNotification(
            bookingWithGuest.guest.firstName,
            Number(bookingWithGuest.refundAmount ?? bookingWithGuest.totalAmount).toFixed(2),
            bookingWithGuest.currency ?? 'EGP',
            bookingWithGuest.property?.title ?? 'Property',
            `#${bookingId}`,
            new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
            bookingWithGuest.paymentMethod ?? 'Card',
            tripsUrl,
          ),
        );
      }
    } catch (e) {
      this.logger.error(`Failed to send refund email: ${(e as Error).message}`);
    }

    return { refundId: refund.id };
  }

  private async refundExperienceBooking(userId: number, bookingId: number, reason?: string) {
    const booking = await this.expBookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Experience booking not found');
    if (booking.guestId !== userId) throw new ForbiddenException('Not authorized');
    if (!booking.stripePaymentIntentId) {
      throw new BadRequestException('No Stripe payment found for this booking');
    }
    if (booking.paymentStatus !== 'paid') {
      throw new BadRequestException('Booking has not been paid via Stripe');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
    });

    await this.expBookingsRepo.update(bookingId, { paymentStatus: 'refunded' });
    return { refundId: refund.id };
  }

  // ─── Webhook ───────────────────────────────────────────────────────────────

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not set — rejecting webhook for security');
      throw new BadRequestException('Webhook verification unavailable — server misconfigured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSucceeded(intent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        this.logger.warn(`Payment failed for intent ${intent.id}: ${intent.last_payment_error?.message}`);
        break;
      }
      case 'charge.refunded': {
        // Handled by refundBooking — no further action needed
        break;
      }
      // FIX P3: Handle Stripe chargebacks to freeze earnings and notify host
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await this.handleChargeDisputed(dispute);
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(intent: Stripe.PaymentIntent) {
    const { bookingId, bookingType } = intent.metadata;
    if (!bookingId) return;

    const id = parseInt(bookingId, 10);
    if (bookingType === 'experience') {
      await this.expBookingsRepo.update(id, { paymentStatus: 'paid' });
      const booking = await this.expBookingsRepo.findOne({ where: { id } });
      if (booking) {
        await this.notificationsService.create(
          booking.guestId,
          'payment_confirmed',
          'Payment Confirmed',
          'تم تأكيد الدفع',
          `Your card payment for experience booking #${id} has been confirmed.`,
          `تم تأكيد دفع بطاقتك لحجز التجربة #${id}.`,
          { bookingId: id },
        );
      }
    } else {
      // Mark payment as paid and confirm booking if it was still pending
      await this.bookingsRepo.update(id, {
        paymentStatus: 'paid',
        status: 'confirmed' as any,
      });
      const booking = await this.bookingsRepo.findOne({ where: { id }, relations: ['guest', 'property'] });
      if (booking) {
        await this.notificationsService.create(
          booking.guestId,
          'payment_confirmed',
          'Payment Confirmed',
          'تم تأكيد الدفع',
          `Your card payment for booking #${id} has been confirmed.`,
          `تم تأكيد دفع بطاقتك للحجز #${id}.`,
          { bookingId: id },
        );

        // Create earnings record for host payout tracking and admin analytics
        try {
          const existingEarning = await this.earningsRepo.findOne({ where: { bookingId: id } });
          if (!existingEarning) {
            const totalAmount = Number(booking.totalAmount);
            const serviceFee = Number(booking.serviceFee);
            const baseAmt = Number(booking.baseAmount);
            const cleaningFee = Number(booking.cleaningFee ?? 0);
            const hostCommission = parseFloat((baseAmt * 0.05).toFixed(2));
            const checkOutDate = new Date(booking.checkOut);
            const availableAt = new Date(checkOutDate);
            availableAt.setDate(availableAt.getDate() + 1); // available 1 day after checkout
            const earning = this.earningsRepo.create({
              hostId: booking.hostId,
              bookingId: id,
              amount: parseFloat((baseAmt * 0.95 + cleaningFee).toFixed(2)),
              platformFee: parseFloat((serviceFee + hostCommission).toFixed(2)),
              currency: booking.currency ?? 'EGP',
              status: new Date() >= availableAt ? 'available' : 'pending',
              availableAt,
            });
            await this.earningsRepo.save(earning);
            this.logger.log(`Earning record created for booking #${id} — host #${booking.hostId}`);
          }
        } catch (e) {
          this.logger.error(`Failed to create earning for booking #${id}: ${(e as Error).message}`);
        }

        // Send invoice email
        try {
          const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
          const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
          const nights = Number(booking.nights) || 1;
          const baseAmount = Number(booking.baseAmount);
          const curr = booking.currency ?? 'EGP';
          const dc = booking.displayCurrency;
          const fmtAmt = (v: number) => this.currencyService.convertAndFormat(v, curr, dc);
          await this.mail.send(
            booking.guest.email,
            'Your payment receipt — Oikivo',
            tplPaymentInvoice(
              booking.guest.firstName,
              `#${id}`,
              new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
              booking.property?.title ?? 'Property',
              booking.checkIn,
              booking.checkOut,
              nights,
              fmtAmt(baseAmount / nights),
              fmtAmt(Number(booking.cleaningFee)),
              fmtAmt(Number(booking.serviceFee)),
              fmtAmt(Number(booking.totalAmount)),
              '',
              booking.paymentMethod ?? 'Card',
              intent.id,
              tripsUrl,
            ),
          );
        } catch (e) {
          this.logger.error(`Failed to send payment invoice email: ${(e as Error).message}`);
        }
      }
    }
  }

  // FIX P3: Handle Stripe chargebacks — freeze earnings, notify host, log dispute
  private async handleChargeDisputed(dispute: Stripe.Dispute) {
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : (dispute.payment_intent as any)?.id;
    if (!paymentIntentId) {
      this.logger.warn(`Stripe dispute ${dispute.id} has no payment_intent — skipping`);
      return;
    }

    const booking = await this.bookingsRepo.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: ['guest', 'property'],
    });
    if (!booking) {
      this.logger.warn(`Stripe dispute ${dispute.id}: no booking found for PI ${paymentIntentId}`);
      return;
    }

    // Freeze associated earnings so host cannot withdraw during dispute
    await this.earningsRepo.update(
      { bookingId: booking.id },
      { status: 'frozen' as any },
    );

    // Mark booking payment as disputed
    await this.bookingsRepo.update(booking.id, {
      paymentStatus: 'disputed' as any,
    });

    // Notify the host about the chargeback
    const hostId = booking.property?.hostId ?? (booking as any).hostId;
    await this.notificationsService.create(
      hostId,
      'payment_disputed',
      'Payment Disputed — Chargeback Filed',
      'نزاع على الدفع — طلب استرداد',
      `A chargeback has been filed for booking #${booking.id} (${booking.property?.title ?? 'property'}). Earnings are frozen until the dispute is resolved.`,
      `تم تقديم طلب استرداد للحجز #${booking.id} (${booking.property?.title ?? 'العقار'}). الأرباح مجمدة حتى يتم حل النزاع.`,
      { bookingId: booking.id, disputeId: dispute.id },
    ).catch(() => {});

    this.logger.warn(`Stripe chargeback filed for booking #${booking.id}, dispute: ${dispute.id}, amount: ${dispute.amount}`);

    await this.auditLog.log({
      eventType: 'payment.stripe.dispute_created',
      actorId: null as any,
      entityType: 'booking',
      entityId: booking.id,
      metadata: {
        disputeId: dispute.id,
        amount: dispute.amount,
        reason: dispute.reason,
        paymentIntentId,
      },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Convert decimal amount to Stripe's smallest currency unit (e.g. piasters for EGP) */
  // FIX P5: Use string-based conversion to avoid IEEE 754 floating-point rounding errors
  private toSmallestUnit(amount: number, currency: string): number {
    const zeroDecimal = ['bif', 'clp', 'djf', 'gnf', 'idr', 'isk', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
    if (zeroDecimal.includes(currency.toLowerCase())) return Math.round(amount);
    // Normalize to exactly 2 decimal places via string, then parse — avoids 1.005*100=100.4999 issues
    const [whole, frac = ''] = amount.toFixed(2).split('.');
    return parseInt(whole, 10) * 100 + parseInt(frac.padEnd(2, '0').slice(0, 2), 10);
  }

  // ─── OPay helpers ──────────────────────────────────────────────────────────

  /** Recursively sort object keys alphabetically (required by OPay signature spec) */
  private sortObjectKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sortObjectKeys(item));
    if (value !== null && typeof value === 'object') {
      return Object.keys(value as object)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = this.sortObjectKeys((value as Record<string, unknown>)[key]);
          return acc;
        }, {});
    }
    return value;
  }

  /**
   * SHA-512 HMAC of the SORTED JSON body, signed with OPAY_PRIVATE_KEY.
   * OPay requires keys to be sorted alphabetically (recursively) before signing.
   */
  private generateOpaySignature(body: object): string {
    const sorted = this.sortObjectKeys(body);
    const bodyStr = JSON.stringify(sorted);
    return crypto.createHmac('sha512', this.opayPrivateKey).update(bodyStr).digest('hex');
  }

  // FIX P2: Timing-safe string comparison to prevent timing attacks on HMAC verification
  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  }

  /** Low-level POST to any OPay endpoint. Returns parsed JSON response. */
  private opayRequest<T>(path: string, body: object): Promise<T> {
    return new Promise((resolve, reject) => {
      const bodyStr = JSON.stringify(body);
      const signature = this.generateOpaySignature(body);
      const fullUrl = new URL(`${this.opayBaseUrl}${path}`);

      const options: https.RequestOptions = {
        hostname: fullUrl.hostname,
        port: 443,
        path: fullUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signature}`,
          'MerchantId': this.opayMerchantId,
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`OPay returned invalid JSON: ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(bodyStr);
      req.end();
    });
  }

  /** Generate a unique OPay merchant reference for booking transactions */
  private opayRef(bookingType: 'stay' | 'experience', bookingId: number): string {
    // Format: js-s-{id}-{base36 timestamp}  — kept under 50 chars
    const prefix = bookingType === 'stay' ? 's' : 'e';
    return `js-${prefix}-${bookingId}-${Date.now().toString(36)}`;
  }

  // ─── OPay Hosted Checkout (PCI Compliant) ────────────────────────────────

  // FIX P1: Replaced raw card flow with OPay hosted checkout — card data never passes through backend.
  // The frontend redirects the user to OPay's hosted payment page. After payment, OPay calls our callback.
  async createOpayCheckout(
    userId: number,
    bookingId: number,
    bookingType: 'stay' | 'experience',
    returnUrl: string,
  ): Promise<{ status: 'redirect'; cashierUrl: string; orderNo?: string; reference: string }> {
    if (!this.opayMerchantId || !this.opayPrivateKey) {
      throw new BadRequestException('OPay is not configured on this server');
    }

    const repo = bookingType === 'stay' ? this.bookingsRepo : this.expBookingsRepo;
    const booking = await (repo as Repository<any>).findOne({
      where: { id: bookingId },
      relations: ['guest'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.guestId !== userId) throw new ForbiddenException('Not your booking');
    if (['cancelled', 'declined'].includes(booking.status)) {
      throw new BadRequestException('This booking can no longer be paid — it has been cancelled or declined');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('Booking is already paid');
    }
    if (booking.paymentStatus === 'submitted') {
      throw new BadRequestException('An InstaPay payment is pending admin verification. Please wait for confirmation or contact support.');
    }

    const reference = this.opayRef(bookingType, bookingId);
    const amountTotal = this.toSmallestUnit(Number(booking.totalAmount), 'egp');
    const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
    const backendUrl = this.config.get<string>('BACKEND_URL', 'http://localhost:3001/api').replace(/\/+$/, '');
    const callbackUrl = `${backendUrl}/payments/opay/callback`;

    const rawPhone = (booking.guest?.phone ?? '').replace(/\D/g, '').replace(/^0/, '');
    const normPhone = rawPhone.startsWith('20') ? rawPhone : `20${rawPhone}`;

    const body = {
      country: 'EG',
      reference,
      amount: { currency: 'EGP', total: amountTotal },
      product: {
        name: `Oikivo booking #${bookingId}`,
        description: bookingType === 'stay' ? 'Property stay booking' : 'Experience booking',
      },
      userInfo: {
        userName: booking.guest?.firstName ?? 'Guest',
        userMobile: normPhone || '201000000000',
        userEmail: booking.guest?.email ?? '',
      },
      payMethod: 'BankCard',
      callbackUrl,
      returnUrl: returnUrl || `${fe.replace(/\/+$/, '')}/en/trips`,
    };

    // Persist the reference BEFORE calling OPay
    await (repo as Repository<any>).update(bookingId, {
      paymentMethod: 'opay-card',
      opayOrderReference: reference,
    });

    this.logger.log(`OPay checkout request for booking #${bookingId}: ref=${reference}, amount=${amountTotal}, env=${this.opayBaseUrl}`);

    const resp = await this.opayRequest<{
      code: string;
      message: string;
      data?: { reference: string; orderNo: string; status: string; cashierUrl?: string };
    }>('/api/v1/international/cashier/create', body);

    this.logger.log(`OPay checkout response for booking #${bookingId}: code=${resp.code} status=${resp.data?.status ?? 'N/A'} orderNo=${resp.data?.orderNo ?? 'N/A'}`);

    if (resp.code === '00000' && resp.data?.cashierUrl) {
      await this.auditLog.log({
        eventType: 'payment.opay.checkout_created',
        actorId: userId,
        entityType: 'booking',
        entityId: bookingId,
        metadata: { paymentMethod: 'opay-checkout', reference, orderNo: resp.data.orderNo },
      });
      return {
        status: 'redirect',
        cashierUrl: resp.data.cashierUrl,
        orderNo: resp.data.orderNo,
        reference,
      };
    }

    this.logger.error(`OPay checkout creation failed for booking #${bookingId}: code=${resp.code} message=${resp.message}`);
    await this.auditLog.log({
      eventType: 'payment.opay.checkout_failed',
      actorId: userId,
      entityType: 'booking',
      entityId: bookingId,
      metadata: { code: resp.code, message: resp.message, reference },
    });
    throw new BadRequestException(`OPay checkout creation failed: ${resp.message ?? 'Unknown error'}`);
  }

  // ─── OPay Refund ───────────────────────────────────────────────────────────

  async refundOpayBooking(
    userId: number,
    bookingId: number,
    bookingType: 'stay' | 'experience',
    reason?: string,
  ): Promise<{ orderStatus: string }> {
    if (!this.opayMerchantId || !this.opayPrivateKey) {
      throw new BadRequestException('OPay is not configured on this server');
    }

    const repo = bookingType === 'stay' ? this.bookingsRepo : this.expBookingsRepo;
    const booking = await (repo as Repository<any>).findOne({
      where: { id: bookingId },
      relations: bookingType === 'stay' ? ['guest', 'property'] : ['guest', 'experience'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    // FIX P4: Only the guest who made the payment can request an OPay refund
    if (booking.guestId !== userId) {
      throw new ForbiddenException('Only the guest who made the payment can request a refund');
    }
    if (!booking.opayOrderReference) {
      throw new BadRequestException('No OPay payment found for this booking');
    }
    if (booking.paymentStatus !== 'paid') {
      throw new BadRequestException('Booking has not been paid via OPay');
    }

    const refundRef = `${booking.opayOrderReference}-ref`;
    const totalAmountPiastres = Math.round(Number(booking.totalAmount) * 100);
    const refundAmount = booking.refundAmount
      ? Math.round(Number(booking.refundAmount) * 100)
      : totalAmountPiastres;
    if (refundAmount > totalAmountPiastres) {
      throw new BadRequestException(
        `Refund amount (${(refundAmount / 100).toFixed(2)} EGP) exceeds the original charge (${(totalAmountPiastres / 100).toFixed(2)} EGP)`,
      );
    }

    const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
    const backendUrl = this.config.get<string>('BACKEND_URL', 'http://localhost:3001/api').replace(/\/+$/, '');
    const body = {
      country: 'EG',
      reference: refundRef,
      originalReference: booking.opayOrderReference,
      amount: { currency: 'EGP', total: refundAmount },
      callbackUrl: `${backendUrl}/payments/opay/callback`,
      ...(reason ? { refundReason: reason } : {}),
    };

    this.logger.log(`OPay refund request for booking #${bookingId}: originalRef=${booking.opayOrderReference}, refundRef=${refundRef}, amount=${refundAmount}`);

    const resp = await this.opayRequest<{
      code: string;
      message: string;
      data?: { reference: string; orderStatus: string };
    }>('/api/v1/international/payment/refund/create', body);

    this.logger.log(`OPay refund response for booking #${bookingId}: code=${resp.code} message=${resp.message} orderStatus=${resp.data?.orderStatus ?? 'N/A'}`);

    if (resp.code !== '00000') {
      throw new BadRequestException(`OPay refund failed: ${resp.message}`);
    }

    await (repo as Repository<any>).update(bookingId, { paymentStatus: 'refunded' });
    await this.auditLog.log({
      eventType: 'payment.opay.refund',
      actorId: userId,
      entityType: 'booking',
      entityId: bookingId,
      metadata: { paymentMethod: 'opay-card', refundAmount, originalRef: booking.opayOrderReference, refundRef },
    });

    // Send refund notification email
    try {
      const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
      const guestEmail = booking.guest?.email;
      if (guestEmail) {
        const title = bookingType === 'stay'
          ? (booking.property?.title ?? 'Property')
          : (booking.experience?.title ?? 'Experience');
        await this.mail.send(
          guestEmail,
          'Your refund is being processed — Oikivo',
          tplRefundNotification(
            booking.guest.firstName,
            (Number(booking.refundAmount ?? booking.totalAmount)).toFixed(2),
            'EGP',
            title,
            `#${bookingId}`,
            new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
            'OPay',
            tripsUrl,
          ),
        );
      }
    } catch (e) {
      this.logger.error(`Failed to send OPay refund email: ${(e as Error).message}`);
    }

    this.logger.log(`OPay refund submitted for ${bookingType} booking #${bookingId}`);
    return { orderStatus: resp.data?.orderStatus ?? 'PENDING' };
  }

  /**
   * Lightweight OPay refund trigger used by BookingsService.cancel().
   * The caller has already computed the refund amount and holds authorization.
   * Throws on API failure so the caller can log and decide whether to block.
   */
  async triggerOpayRefund(
    opayOrderReference: string,
    refundAmountEGP: number,
    bookingId: number,
  ): Promise<void> {
    if (!this.opayMerchantId || !this.opayPrivateKey) {
      throw new Error('OPay is not configured');
    }
    const backendUrl = this.config.get<string>('BACKEND_URL', 'http://localhost:3001/api').replace(/\/+$/, '');
    // Use a timestamp suffix to avoid reference collisions on retry
    const refundRef = `${opayOrderReference}-r${crypto.randomBytes(4).toString('hex')}`;
    const refundTotal = Math.round(refundAmountEGP * 100);
    const body = {
      country: 'EG',
      reference: refundRef,
      originalReference: opayOrderReference,
      amount: { currency: 'EGP', total: refundTotal },
      callbackUrl: `${backendUrl}/payments/opay/callback`,
    };
    this.logger.log(`OPay triggerRefund for booking #${bookingId}: originalRef=${opayOrderReference}, refundRef=${refundRef}, amount=${refundTotal}`);
    const resp = await this.opayRequest<{ code: string; message: string; data?: { orderStatus: string } }>(
      '/api/v1/international/payment/refund/create',
      body,
    );
    this.logger.log(`OPay triggerRefund response for booking #${bookingId}: code=${resp.code} message=${resp.message} orderStatus=${resp.data?.orderStatus ?? 'N/A'}`);
    if (resp.code !== '00000') {
      throw new Error(`OPay refund API error ${resp.code}: ${resp.message}`);
    }
    this.logger.log(`OPay refund triggered for booking #${bookingId}, ref: ${refundRef}`);
  }

  // ─── OPay Callback Handler ─────────────────────────────────────────────────

  async handleOpayCallback(
    body: Record<string, any>,
    authHeader: string,
    merchantIdHeader: string,
  ): Promise<void> {
    if (!this.opayMerchantId || !this.opayPrivateKey) return;

    // FIX P2: Verify callback HMAC using timing-safe comparison to prevent timing attacks
    const expectedSig = this.generateOpaySignature(body);
    const receivedSig = (authHeader ?? '').replace(/^Bearer\s+/i, '');
    if (!receivedSig || !this.timingSafeCompare(receivedSig, expectedSig)) {
      this.logger.warn(`OPay callback signature mismatch — rejected (ref: ${(body as any)?.reference ?? 'unknown'})`);
      throw new BadRequestException('Invalid OPay callback signature');
    }
    if (!merchantIdHeader || !this.timingSafeCompare(merchantIdHeader, this.opayMerchantId)) {
      this.logger.warn(`OPay callback MerchantId mismatch — rejected (ref: ${(body as any)?.reference ?? 'unknown'})`);
      throw new BadRequestException('Invalid OPay merchant ID');
    }

    const { reference, status } = body as { reference?: string; status?: string };
    if (!reference || !status) return;

    const isPaid = status === 'SUCCESS';

    // Try stay bookings first
    const stayBooking = await this.bookingsRepo.findOne({ where: { opayOrderReference: reference }, relations: ['guest', 'property'] });
    if (stayBooking) {
      if (isPaid && stayBooking.paymentStatus !== 'paid') {
        // X12: wrap booking-status update + earnings creation in a single DB transaction
        // so that if earnings creation fails, the booking is NOT left in a paid/incomplete state.
        await this.bookingsRepo.manager.transaction(async (em) => {
          await em.update(BookingEntity, stayBooking.id, { paymentStatus: 'paid', status: 'confirmed' as any });

          const existingEarning = await em.findOne(EarningEntity, { where: { bookingId: stayBooking.id } });
          if (!existingEarning) {
            // FIX B6: Use canonical earning formula consistent with Stripe handler
            const baseAmt = Number(stayBooking.baseAmount);
            const cleaningFee = Number(stayBooking.cleaningFee ?? 0);
            const serviceFee = Number(stayBooking.serviceFee);
            const hostCommission = parseFloat((baseAmt * 0.05).toFixed(2));
            const checkOutDate = new Date(stayBooking.checkOut);
            const availableAt = new Date(checkOutDate);
            availableAt.setDate(availableAt.getDate() + 1);
            await em.save(EarningEntity, em.create(EarningEntity, {
              hostId: stayBooking.hostId,
              bookingId: stayBooking.id,
              amount: parseFloat((baseAmt * 0.95 + cleaningFee).toFixed(2)),
              platformFee: parseFloat((serviceFee + hostCommission).toFixed(2)),
              currency: stayBooking.currency ?? 'EGP',
              status: new Date() >= availableAt ? 'available' : 'pending',
              availableAt,
            }));
          }
        });

        await this.notificationsService.create(
          stayBooking.guestId,
          'payment_confirmed', 'Payment Confirmed', 'تم تأكيد الدفع',
          `Your OPay payment for booking #${stayBooking.id} has been confirmed.`,
          `تم تأكيد دفع OPay للحجز #${stayBooking.id}.`,
          { bookingId: stayBooking.id },
        );

        this.logger.log(`OPay callback: stay booking #${stayBooking.id} marked as paid`);
      }
      return;
    }

    // Try experience bookings
    const expBooking = await this.expBookingsRepo.findOne({ where: { opayOrderReference: reference } });
    if (expBooking && isPaid && expBooking.paymentStatus !== 'paid') {
      await this.expBookingsRepo.update(expBooking.id, { paymentStatus: 'paid' });
      await this.notificationsService.create(
        expBooking.guestId,
        'payment_confirmed', 'Payment Confirmed', 'تم تأكيد الدفع',
        `Your OPay payment for experience booking #${expBooking.id} has been confirmed.`,
        `تم تأكيد دفع OPay لحجز التجربة #${expBooking.id}.`,
        { bookingId: expBooking.id },
      );
      this.logger.log(`OPay callback: experience booking #${expBooking.id} marked as paid`);
    }
  }
}
