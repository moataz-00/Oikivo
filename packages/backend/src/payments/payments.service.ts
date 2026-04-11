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
    if (booking.guestId !== userId && booking.hostId !== userId) {
      throw new ForbiddenException('Not authorized');
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
      this.logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping webhook verification');
      return;
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
            const checkOutDate = new Date(booking.checkOut);
            const availableAt = new Date(checkOutDate);
            availableAt.setDate(availableAt.getDate() + 1); // available 1 day after checkout
            const earning = this.earningsRepo.create({
              hostId: booking.hostId,
              bookingId: id,
              amount: parseFloat((totalAmount - serviceFee).toFixed(2)),
              platformFee: serviceFee,
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

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Convert decimal amount to Stripe's smallest currency unit (e.g. piasters for EGP) */
  private toSmallestUnit(amount: number, currency: string): number {
    // Zero-decimal currencies do not need x100 (complete Stripe list)
    const zeroDecimal = ['bif', 'clp', 'djf', 'gnf', 'idr', 'isk', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
    if (zeroDecimal.includes(currency.toLowerCase())) return Math.round(amount);
    return Math.round(amount * 100);
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

  // ─── OPay Non-3DS Card Payment ─────────────────────────────────────────────

  async createOpayCardPayment(
    userId: number,
    bookingId: number,
    bookingType: 'stay' | 'experience',
    card: {
      cardHolderName: string;
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
    },
    returnUrl: string,
  ): Promise<{ status: 'success' | 'pending' | 'failed'; orderNo?: string; message?: string }> {
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
    // Issue #8: Block duplicate payment attempts
    if (booking.paymentStatus === 'submitted') {
      throw new BadRequestException('An InstaPay payment is pending admin verification. Please wait for confirmation or contact support.');
    }

    const reference = this.opayRef(bookingType, bookingId);
    // OPay amounts are in smallest currency unit (piastres for EGP: 1 EGP = 100 piastres)
    const amountTotal = Math.round(Number(booking.totalAmount) * 100);
    const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
    const backendUrl = this.config.get<string>('BACKEND_URL', 'http://localhost:3001/api').replace(/\/+$/, '');
    const callbackUrl = `${backendUrl}/payments/opay/callback`;

    // Normalise guest phone to Egyptian international format (e.g. 201XXXXXXXXX)
    const rawPhone = (booking.guest?.phone ?? '').replace(/\D/g, '').replace(/^0/, '');
    const normPhone = rawPhone.startsWith('20') ? rawPhone : `20${rawPhone}`;

    const body = {
      country: 'EG',
      reference,
      amount: { currency: 'EGP', total: amountTotal },
      bankcard: {
        cardHolderName: card.cardHolderName,
        cardNumber: card.cardNumber,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        cvv: card.cvv,
        enable3DS: false,
      },
      payMethod: 'BankCard',
      product: {
        name: `Oikivo booking #${bookingId}`,
        description: bookingType === 'stay' ? 'Property stay booking' : 'Experience booking',
      },
      userInfo: {
        userName: card.cardHolderName,
        userMobile: normPhone || '201000000000',
        userEmail: booking.guest?.email ?? '',
      },
      callbackUrl,
      returnUrl: returnUrl || `${fe.replace(/\/+$/, '')}/en/trips`,
    };

    // X8: Persist the reference BEFORE calling OPay — so it can always be retrieved
    // even if the app crashes mid-request or OPay returns an unexpected error.
    await (repo as Repository<any>).update(bookingId, {
      paymentMethod: 'opay-card',
      opayOrderReference: reference,
    });

    this.logger.log(`OPay card payment request for booking #${bookingId}: ref=${reference}, amount=${amountTotal}, env=${this.opayBaseUrl}`);

    const resp = await this.opayRequest<{
      code: string;
      message: string;
      data?: { reference: string; orderNo: string; status: string; failureReason?: string };
    }>('/api/v1/international/payment/create', body);

    this.logger.log(`OPay card payment response for booking #${bookingId}: code=${resp.code} message=${resp.message} status=${resp.data?.status ?? 'N/A'} orderNo=${resp.data?.orderNo ?? 'N/A'} failureReason=${resp.data?.failureReason ?? 'N/A'}`);

    if (resp.code === '00000' && resp.data?.status === 'SUCCESS') {
      // Issue #5: wrap UPDATE + EarningEntity creation in a single transaction
      if (bookingType === 'stay') {
        await this.bookingsRepo.manager.transaction(async (em) => {
          await em.update(BookingEntity, bookingId, { paymentStatus: 'paid', status: 'confirmed' as any });
          const existingEarning = await em.findOne(EarningEntity, { where: { bookingId } });
          if (!existingEarning) {
            const totalAmount = Number(booking.totalAmount);
            const serviceFee = Number(booking.serviceFee);
            const checkOutDate = new Date(booking.checkOut);
            const availableAt = new Date(checkOutDate);
            availableAt.setDate(availableAt.getDate() + 1);
            await em.save(EarningEntity, em.create(EarningEntity, {
              hostId: booking.hostId,
              bookingId,
              amount: parseFloat((totalAmount - serviceFee).toFixed(2)),
              platformFee: serviceFee,
              currency: (booking.currency ?? 'EGP'),
              status: new Date() >= availableAt ? 'available' : 'pending',
              availableAt,
            }));
          }
        });
      } else {
        await (repo as Repository<any>).update(bookingId, { paymentStatus: 'paid' });
      }

      this.logger.log(`OPay card payment SUCCESS for ${bookingType} booking #${bookingId}, ref: ${reference}`);
      return { status: 'success', orderNo: resp.data.orderNo };
    }

    if (resp.code === '00000' && resp.data?.status === 'PENDING') {
      this.logger.log(`OPay card payment PENDING for ${bookingType} booking #${bookingId}, ref: ${reference}`);
      return {
        status: 'pending',
        orderNo: resp.data?.orderNo,
        message: 'Payment is being processed. You will be notified once it is confirmed.',
      };
    }

    const failureReason = resp.data?.failureReason ?? resp.message ?? 'Payment failed. Please check your card details.';
    this.logger.warn(`OPay card payment FAILED for booking #${bookingId}: code=${resp.code} message=${resp.message} failureReason=${resp.data?.failureReason ?? 'N/A'}`);

    // X16: Send payment failure email so guest knows to retry
    try {
      const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const tripsUrl = `${fe.replace(/\/+$/, '')}/en/trips`;
      if (booking.guest?.email) {
        await this.mail.send(
          booking.guest.email,
          'Payment unsuccessful — please retry — Oikivo',
          `<p>Hi ${booking.guest.firstName},</p>
<p>Your OPay card payment for booking <strong>#${bookingId}</strong> could not be processed.</p>
<p><strong>Reason:</strong> ${failureReason}</p>
<p>Please <a href="${tripsUrl}">visit your trips page</a> to retry payment. Make sure your card details are correct and that you have sufficient funds.</p>
<p>If the problem persists, try a different card or contact your bank.</p>`,
        );
      }
    } catch (e) {
      this.logger.error(`Failed to send OPay failure email: ${(e as Error).message}`);
    }

    return {
      status: 'failed',
      message: failureReason,
    };
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
    if (booking.guestId !== userId && booking.hostId !== userId) throw new ForbiddenException('Not authorized');
    if (!booking.opayOrderReference) {
      throw new BadRequestException('No OPay payment found for this booking');
    }
    if (booking.paymentStatus !== 'paid') {
      throw new BadRequestException('Booking has not been paid via OPay');
    }

    const refundRef = `${booking.opayOrderReference}-ref`;
    const refundAmount = booking.refundAmount
      ? Math.round(Number(booking.refundAmount) * 100)
      : Math.round(Number(booking.totalAmount) * 100);

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

    // Verify the callback came from OPay by re-computing the HMAC
    const expectedSig = this.generateOpaySignature(body);
    const receivedSig = (authHeader ?? '').replace(/^Bearer\s+/i, '');
    if (!receivedSig || receivedSig !== expectedSig) {
      this.logger.warn('OPay callback signature missing or mismatch — rejected');
      return;
    }
    if (!merchantIdHeader || merchantIdHeader !== this.opayMerchantId) {
      this.logger.warn('OPay callback MerchantId missing or mismatch — rejected');
      return;
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
            const totalAmount = Number(stayBooking.totalAmount);
            const serviceFee = Number(stayBooking.serviceFee);
            const checkOutDate = new Date(stayBooking.checkOut);
            const availableAt = new Date(checkOutDate);
            availableAt.setDate(availableAt.getDate() + 1);
            await em.save(EarningEntity, em.create(EarningEntity, {
              hostId: stayBooking.hostId,
              bookingId: stayBooking.id,
              amount: parseFloat((totalAmount - serviceFee).toFixed(2)),
              platformFee: serviceFee,
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
