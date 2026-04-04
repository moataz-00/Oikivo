import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ConsultantEntity } from '../entities/consultant.entity';
import { ConsultantDocumentEntity } from '../entities/consultant-document.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { ConsultationReviewEntity } from '../entities/consultation-review.entity';
import { ConsultantAvailabilityEntity } from '../entities/consultant-availability.entity';
import { ConsultationServiceEntity } from '../entities/consultation-service.entity';
import { ConsultantVacationBlockEntity } from '../entities/consultant-vacation-block.entity';
import { ConsultantEarningEntity } from '../entities/consultant-earning.entity';
import { ConsultantPayoutRequestEntity } from '../entities/consultant-payout-request.entity';
import { UserEntity } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplConsultationRequestReceived, tplConsultationRequestSubmitted, tplConsultationConfirmed, tplConsultationDeclined, tplConsultationCompleted, tplConsultationInstapayPending, tplConsultantSuspendedClientNotice, tplConsultantApplicationDecision, tplConsultationPaymentReceived, tplConsultantApprovedClientNotice, tplConsultantPayoutProcessed } from '../mail/mail.service';
import {
  ApplyAsConsultantDto, UpdateConsultantProfileDto,
  BookConsultationDto, RespondToBookingDto, CompleteBookingDto,
  CreateConsultationReviewDto, ReplyToReviewDto,
  AdminReviewConsultantDto, SetAvailabilityDto,
  CreateConsultationServiceDto, UpdateConsultationServiceDto,
  BlockVacationDto, RequestConsultantPayoutDto, UpdateConsultantPayoutSettingsDto,
  AdminProcessConsultantPayoutDto,
} from './dto/consultations.dto';

const PLATFORM_FEE_PERCENT = 0.10; // 10% from each side (consultant + client)

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(ConsultantEntity)
    private consultantRepo: Repository<ConsultantEntity>,
    @InjectRepository(ConsultantDocumentEntity)
    private docRepo: Repository<ConsultantDocumentEntity>,
    @InjectRepository(ConsultationBookingEntity)
    private bookingRepo: Repository<ConsultationBookingEntity>,
    @InjectRepository(ConsultationReviewEntity)
    private reviewRepo: Repository<ConsultationReviewEntity>,
    @InjectRepository(ConsultantAvailabilityEntity)
    private availabilityRepo: Repository<ConsultantAvailabilityEntity>,
    @InjectRepository(ConsultationServiceEntity)
    private serviceRepo: Repository<ConsultationServiceEntity>,
    @InjectRepository(ConsultantVacationBlockEntity)
    private vacationRepo: Repository<ConsultantVacationBlockEntity>,
    @InjectRepository(ConsultantEarningEntity)
    private earningRepo: Repository<ConsultantEarningEntity>,
    @InjectRepository(ConsultantPayoutRequestEntity)
    private payoutRepo: Repository<ConsultantPayoutRequestEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    private notificationsService: NotificationsService,
    private mail: MailService,
    private configService: ConfigService,
  ) {}

  // ═══════════════════════════════════════════════════════════
  //  CONSULTANT APPLICATION
  // ═══════════════════════════════════════════════════════════

  async applyAsConsultant(userId: number, dto: ApplyAsConsultantDto) {
    const existing = await this.consultantRepo.findOne({ where: { userId } });
    if (existing) throw new ConflictException('You already have a consultant application');

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const consultant = this.consultantRepo.create({
      userId,
      displayName: dto.displayName,
      bio: dto.bio,
      specializations: dto.specializations,
      yearsExperience: dto.yearsExperience,
      languages: dto.languages,
      hourlyRate: dto.hourlyRate,
      currency: dto.currency ?? 'EGP',
      status: 'pending',
    });

    return this.consultantRepo.save(consultant);
  }

  async getMyConsultantProfile(userId: number) {
    const consultant = await this.consultantRepo.findOne({
      where: { userId },
      relations: ['documents', 'user', 'availability'],
    });
    if (!consultant) throw new NotFoundException('You are not registered as a consultant');
    return consultant;
  }

  async updateConsultantProfile(userId: number, dto: UpdateConsultantProfileDto) {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) throw new NotFoundException('Consultant profile not found');

    Object.assign(consultant, dto);
    return this.consultantRepo.save(consultant);
  }

  async uploadDocument(userId: number, documentType: string, fileUrl: string, originalName: string) {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) throw new NotFoundException('Consultant profile not found');

    return this.docRepo.save(this.docRepo.create({
      consultantId: consultant.id,
      documentType,
      fileUrl,
      originalName,
      status: 'pending',
    }));
  }

  // ═══════════════════════════════════════════════════════════
  //  BROWSE CONSULTANTS (PUBLIC)
  // ═══════════════════════════════════════════════════════════

  async listConsultants(filters: {
    specialization?: string;
    minRating?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 50);

    const qb = this.consultantRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .where('c.status = :status', { status: 'approved' });

    if (filters.specialization) {
      qb.andWhere('JSON_CONTAINS(c.specializations, :spec)', {
        spec: JSON.stringify(filters.specialization),
      });
    }
    if (filters.minRating) {
      qb.andWhere('c.avg_rating >= :minRating', { minRating: filters.minRating });
    }
    if (filters.maxPrice) {
      qb.andWhere('c.hourly_rate <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    qb.orderBy('c.isFeatured', 'DESC')
      .addOrderBy('c.avgRating', 'DESC')
      .addOrderBy('c.totalSessions', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getConsultantPublicProfile(consultantId: number) {
    const consultant = await this.consultantRepo.findOne({
      where: { id: consultantId, status: 'approved' },
      relations: ['user', 'documents'],
    });
    if (!consultant) throw new NotFoundException('Consultant not found');

    // Load recent reviews (exclude admin-hidden ones for public view)
    const reviews = await this.reviewRepo.find({
      where: { consultantId, isHidden: false as any },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Load availability
    const availability = await this.availabilityRepo.find({
      where: { consultantId, isActive: true as any },
    });

    return { consultant, reviews, availability };
  }

  // ═══════════════════════════════════════════════════════════
  //  BOOKING A CONSULTATION (client = host seeking help)
  // ═══════════════════════════════════════════════════════════

  async bookConsultation(clientId: number, dto: BookConsultationDto) {
    const consultant = await this.consultantRepo.findOne({
      where: { id: dto.consultantId, status: 'approved' },
      relations: ['user'],
    });
    if (!consultant) throw new NotFoundException('Consultant not found or not available');
    if (consultant.userId === clientId) throw new BadRequestException('You cannot book your own consultation');

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) throw new BadRequestException('Scheduled time must be in the future');

    // Check daily booking limit (default: 10 per day)
    const MAX_BOOKINGS_PER_DAY = 10;
    const dayStart = new Date(scheduledAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledAt);
    dayEnd.setHours(23, 59, 59, 999);

    const existingCount = await this.bookingRepo.createQueryBuilder('b')
      .where('b.consultant_id = :cid', { cid: consultant.id })
      .andWhere('b.scheduled_at BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: ['cancelled', 'no_show'] })
      .getCount();

    if (existingCount >= MAX_BOOKINGS_PER_DAY) {
      throw new BadRequestException('Consultant is fully booked for this day');
    }

    const deliveryMode = dto.deliveryMode ?? 'video_call';

    // C5: If serviceId provided, use service price & duration; otherwise use hourly rate
    let basePrice: number;
    let durationMinutes = dto.durationMinutes;
    let serviceIdToStore: number | null = null;

    if (dto.serviceId) {
      const service = await this.serviceRepo.findOne({
        where: { id: dto.serviceId, consultantId: consultant.id, isActive: true },
      });
      if (!service) throw new NotFoundException('Consultation service not found or inactive');
      basePrice = Number(service.price);
      durationMinutes = service.durationMinutes;
      serviceIdToStore = service.id;
    } else {
      basePrice = Math.round(Number(consultant.hourlyRate) * (durationMinutes / 60) * 100) / 100;
    }

    // Platform takes 10% from the client side only; consultant receives the full base rate
    const platformFee = Math.round(basePrice * PLATFORM_FEE_PERCENT * 100) / 100;
    const price = Math.round((basePrice + platformFee) * 100) / 100;
    const consultantPayout = basePrice;

    const booking = this.bookingRepo.create({
      serviceId: serviceIdToStore,
      consultantId: consultant.id,
      clientId,
      scheduledAt,
      durationMinutes,
      deliveryMode,
      price,
      platformFee,
      consultantPayout,
      currency: consultant.currency ?? 'EGP',
      status: 'pending',
      paymentMethod: dto.paymentMethod ?? 'card',
      clientNote: dto.clientNote,
    });

    const saved = await this.bookingRepo.save(booking);

    // Load users for email
    const [client, consultantUser] = await Promise.all([
      this.usersRepo.findOne({ where: { id: clientId } }),
      this.usersRepo.findOne({ where: { id: consultant.userId } }),
    ]);

    // Notify consultant
    await this.notificationsService.create(
      consultant.userId,
      'booking_requested',
      'New consultation booking request',
      'طلب حجز استشارة جديد',
      `You have a new consultation booking request`,
      `لديك طلب حجز استشارة جديد`,
      { consultationBookingId: saved.id },
    );

    // Send emails
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const feBase = fe.replace(/\/+$/, '');
      const instapayPhone = this.configService.get<string>('INSTAPAY_PHONE', '010-XXXX-XXXX');
      const instapayName = this.configService.get<string>('INSTAPAY_NAME', 'Oikivo Platform');
      const scheduledLabel = new Date(scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
      const bookingRef = `CONSULT-${saved.id}`;
      const sessionLabel = `${durationMinutes} min Consultation`;

      if (consultantUser) {
        await this.mail.send(
          consultantUser.email,
          'New consultation booking request — Oikivo',
          tplConsultationRequestReceived(
            consultantUser.firstName,
            client?.firstName ?? 'Client',
            sessionLabel,
            scheduledLabel,
            durationMinutes,
            consultantPayout.toFixed(2),
            consultant.currency ?? 'EGP',
            `${feBase}/en/consultations/dashboard`,
          ),
        );
      }

      if (client) {
        if (saved.paymentMethod === 'instapay') {
          await this.mail.send(
            client.email,
            'Complete your InstaPay payment — Oikivo',
            tplConsultationInstapayPending(
              client.firstName,
              consultant.displayName,
              sessionLabel,
              scheduledLabel,
              price.toFixed(2),
              consultant.currency ?? 'EGP',
              instapayPhone,
              instapayName,
              bookingRef,
              `${feBase}/en/consultations/my-bookings`,
            ),
          );
        } else {
          await this.mail.send(
            client.email,
            'Consultation request submitted — Oikivo',
            tplConsultationRequestSubmitted(
              client.firstName,
              consultant.displayName,
              sessionLabel,
              scheduledLabel,
              durationMinutes,
              price.toFixed(2),
              consultant.currency ?? 'EGP',
              `${feBase}/en/consultations/my-bookings`,
            ),
          );
        }
      }
    } catch (e) {
      // Non-blocking — booking is already saved; log and continue
    }

    return saved;
  }

  async markInstapayPaid(consultantUserId: number, bookingId: number) {
    const consultant = await this.getApprovedConsultant(consultantUserId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, consultantId: consultant.id },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.paymentMethod !== 'instapay') {
      throw new BadRequestException('This booking does not use InstaPay');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('Payment already marked as paid');
    }

    booking.paymentStatus = 'paid';
    const saved = await this.bookingRepo.save(booking);

    // C10: Notify consultant that payment has been received
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const feBase = fe.replace(/\/+$/, '');
      const [consultantUser, client] = await Promise.all([
        this.usersRepo.findOne({ where: { id: consultant.userId } }),
        this.usersRepo.findOne({ where: { id: booking.clientId } }),
      ]);
      if (consultantUser) {
        const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
        const sessionLabel = `${booking.durationMinutes} min Consultation`;
        await this.mail.send(
          consultantUser.email,
          'Payment confirmed for your consultation booking — Oikivo',
          tplConsultationPaymentReceived(
            consultant.displayName,
            client ? `${client.firstName} ${client.lastName}` : `Client #${booking.clientId}`,
            sessionLabel,
            scheduledLabel,
            Number(booking.consultantPayout).toFixed(2),
            booking.currency ?? 'EGP',
            String(booking.id),
            `${feBase}/en/consultations/dashboard`,
          ),
        );
      }
    } catch { /* non-blocking */ }

    return saved;
  }

  async respondToBooking(userId: number, bookingId: number, dto: RespondToBookingDto) {
    const consultant = await this.getApprovedConsultant(userId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, consultantId: consultant.id },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'pending') throw new BadRequestException('Booking is not pending');

    if (dto.action === 'confirmed') {
      // G23: Block confirmation of InstaPay bookings until payment is verified
      if (booking.paymentMethod === 'instapay' && booking.paymentStatus !== 'paid') {
        throw new BadRequestException(
          'Cannot confirm an InstaPay booking before payment is verified. ' +
          'Ask the client to submit their payment reference, then use \'Mark InstaPay paid\' to confirm receipt.',
        );
      }
      booking.status = 'confirmed';
      booking.meetingLink = dto.meetingLink ?? null;
      booking.consultantNote = dto.consultantNote ?? null;

      await this.notificationsService.create(
        booking.clientId,
        'booking_confirmed',
        'Consultation booking confirmed!',
        'تم تأكيد حجز الاستشارة!',
        `Your consultation has been confirmed`,
        `تم تأكيد استشارتك`,
        { consultationBookingId: booking.id },
      );

      // Send confirmation email to client
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const feBase = fe.replace(/\/+$/, '');
        const [client, consultantUser] = await Promise.all([
          this.usersRepo.findOne({ where: { id: booking.clientId } }),
          this.usersRepo.findOne({ where: { id: userId } }),
        ]);
        if (client) {
          const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
          const sessionLabel = `${booking.durationMinutes} min Consultation`;
          await this.mail.send(
            client.email,
            'Your consultation is confirmed! — Oikivo',
            tplConsultationConfirmed(
              client.firstName,
              consultant.displayName,
              sessionLabel,
              scheduledLabel,
              booking.durationMinutes,
              Number(booking.price).toFixed(2),
              booking.currency ?? 'EGP',
              booking.meetingLink,
              `${feBase}/en/consultations/my-bookings`,
            ),
          );
        }
        // C10: Send payment receipt to consultant when confirming a paid booking
        if (booking.paymentStatus === 'paid' && consultantUser) {
          const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
          const sessionLabel = `${booking.durationMinutes} min Consultation`;
          try {
            await this.mail.send(
              consultantUser.email,
              'Payment confirmed for your consultation booking — Oikivo',
              tplConsultationPaymentReceived(
                consultant.displayName,
                client ? `${client.firstName} ${client.lastName}` : `Client #${booking.clientId}`,
                sessionLabel,
                scheduledLabel,
                Number(booking.consultantPayout).toFixed(2),
                booking.currency ?? 'EGP',
                String(booking.id),
                `${feBase}/en/consultations/dashboard`,
              ),
            );
          } catch { /* non-blocking */ }
        }
      } catch (e) { /* non-blocking */ }
    } else {
      booking.status = 'cancelled';
      booking.cancelledBy = 'consultant';
      booking.cancellationReason = dto.cancellationReason ?? null;

      await this.notificationsService.create(
        booking.clientId,
        'booking_declined',
        'Consultation booking declined',
        'تم رفض حجز الاستشارة',
        `Your consultation booking was declined`,
        `تم رفض حجز استشارتك`,
        { consultationBookingId: booking.id },
      );

      // Send decline email to client
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const feBase = fe.replace(/\/+$/, '');
        const client = await this.usersRepo.findOne({ where: { id: booking.clientId } });
        if (client) {
          const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
          const sessionLabel = `${booking.durationMinutes} min Consultation`;
          await this.mail.send(
            client.email,
            'Consultation request declined — Oikivo',
            tplConsultationDeclined(
              client.firstName,
              consultant.displayName,
              sessionLabel,
              scheduledLabel,
              dto.cancellationReason ?? null,
              `${feBase}/en/consultations`,
            ),
          );
        }
      } catch (e) { /* non-blocking */ }
    }

    return this.bookingRepo.save(booking);
  }

  async completeBooking(userId: number, bookingId: number, dto: CompleteBookingDto) {
    const consultant = await this.getApprovedConsultant(userId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, consultantId: consultant.id },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be completed in its current state');
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    booking.paymentStatus = 'hold'; // released to 'paid' after 48h by scheduler (H16)
    booking.consultantNote = dto.consultantNote ?? booking.consultantNote;

    // Increment total sessions
    await this.consultantRepo.increment({ id: consultant.id }, 'totalSessions', 1);

    const saved = await this.bookingRepo.save(booking);

    // C12: Create consultant earning record with 48-hour hold
    const availableAt = new Date(saved.completedAt ?? new Date());
    availableAt.setHours(availableAt.getHours() + 48);
    try {
      const existing = await this.earningRepo.findOne({ where: { bookingId: booking.id } });
      if (!existing) {
        await this.earningRepo.save(
          this.earningRepo.create({
            consultantId: consultant.id,
            bookingId: booking.id,
            amount: Number(booking.consultantPayout),
            platformFee: Number(booking.platformFee),
            currency: booking.currency ?? 'EGP',
            status: 'hold',
            availableAt,
          }),
        );
      }
    } catch { /* non-blocking */ }

    // Send completion + review prompt email to client
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const feBase = fe.replace(/\/+$/, '');
      const client = await this.usersRepo.findOne({ where: { id: booking.clientId } });
      if (client) {
        const sessionLabel = `${booking.durationMinutes} min Consultation`;
        await this.mail.send(
          client.email,
          'Session completed — please leave a review! — Oikivo',
          tplConsultationCompleted(
            client.firstName,
            consultant.displayName,
            sessionLabel,
            Number(booking.consultantPayout).toFixed(2),
            booking.currency ?? 'EGP',
            `${feBase}/en/consultations/my-bookings`,
          ),
        );
      }
    } catch (e) { /* non-blocking */ }

    return saved;
  }

  async cancelBooking(userId: number, bookingId: number, reason?: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const isClient = booking.clientId === userId;
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    const isConsultant = consultant && booking.consultantId === consultant.id;

    if (!isClient && !isConsultant) throw new ForbiddenException('Not authorized');
    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    booking.status = 'cancelled';
    booking.cancelledBy = isClient ? 'client' : 'consultant';
    booking.cancellationReason = reason ?? null;

    // G24: Graduated refund policy for client-initiated cancellations
    if (isClient && booking.paymentStatus === 'paid') {
      const now = new Date();
      const scheduledAt = new Date(booking.scheduledAt);
      const hoursUntilSession = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilSession >= 24) {
        // Full refund — cancelled well in advance
        booking.refundAmount = Number(booking.price);
        booking.cancellationFee = 0;
        booking.paymentStatus = 'refund_pending';
      } else if (hoursUntilSession >= 1) {
        // 50% refund — cancelled same-day but not last minute
        booking.refundAmount = Math.round(Number(booking.price) * 0.5 * 100) / 100;
        booking.cancellationFee = Math.round(Number(booking.price) * 0.5 * 100) / 100;
        booking.paymentStatus = 'refund_pending';
      }
      // else: < 1 hour before session — no refund, paymentStatus stays 'paid'
    }

    return this.bookingRepo.save(booking);
  }

  // G10: Client submits InstaPay payment reference/proof for a consultation booking
  async submitConsultationInstapayProof(
    clientId: number,
    bookingId: number,
    dto: { reference: string; proofUrl?: string },
  ): Promise<ConsultationBookingEntity> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, clientId },
      relations: ['consultant'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.paymentMethod !== 'instapay') {
      throw new BadRequestException('Only InstaPay bookings require manual proof submission');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('Payment has already been confirmed');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Cannot submit payment for a cancelled booking');
    }
    if (!dto.reference?.trim()) {
      throw new BadRequestException('Payment reference is required');
    }

    booking.paymentStatus = 'submitted';
    booking.paymentReference = dto.reference.trim();
    if (dto.proofUrl) booking.paymentProofUrl = dto.proofUrl;

    const saved = await this.bookingRepo.save(booking);

    // Notify consultant to verify payment
    if (booking.consultant?.userId) {
      await this.notificationsService.create(
        booking.consultant.userId,
        'payment_submitted',
        'InstaPay proof received — please verify',
        'تم استلام إثبات InstaPay — يرجى التحقق',
        `Client submitted an InstaPay reference for booking #${booking.id}. Reference: ${dto.reference}. Please verify and confirm.`,
        `قدّم العميل مرجع دفع InstaPay للحجز #${booking.id}. المرجع: ${dto.reference}. يرجى التحقق والتأكيد.`,
        { consultationBookingId: booking.id },
      );
    }

    return saved;
  }

  async getMyBookingsAsClient(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.bookingRepo.findAndCount({
      where: { clientId: userId },
      relations: ['service', 'consultant', 'consultant.user'],
      order: { scheduledAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMyBookingsAsConsultant(userId: number, page = 1, limit = 20) {
    const consultant = await this.getApprovedConsultant(userId);
    const [items, total] = await this.bookingRepo.findAndCount({
      where: { consultantId: consultant.id },
      relations: ['service', 'client'],
      order: { scheduledAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ═══════════════════════════════════════════════════════════
  //  REVIEWS
  // ═══════════════════════════════════════════════════════════

  async createReview(userId: number, bookingId: number, dto: CreateConsultationReviewDto) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, clientId: userId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'completed') throw new BadRequestException('Can only review completed bookings');

    const existing = await this.reviewRepo.findOne({ where: { bookingId } });
    if (existing) throw new ConflictException('Review already exists for this booking');

    return this.reviewRepo.save(this.reviewRepo.create({
      bookingId,
      reviewerId: userId,
      consultantId: booking.consultantId,
      ...dto,
    }));
  }

  async replyToReview(userId: number, reviewId: number, dto: ReplyToReviewDto) {
    const consultant = await this.getApprovedConsultant(userId);
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, consultantId: consultant.id },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.consultantReply) throw new ConflictException('Already replied');

    review.consultantReply = dto.reply;
    review.consultantRepliedAt = new Date();
    return this.reviewRepo.save(review);
  }

  // ═══════════════════════════════════════════════════════════
  //  AVAILABILITY
  // ═══════════════════════════════════════════════════════════

  async setAvailability(userId: number, dto: SetAvailabilityDto) {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) throw new NotFoundException('Consultant profile not found');

    // Clear existing and re-create
    await this.availabilityRepo.delete({ consultantId: consultant.id });

    const slots = dto.slots.map(s => this.availabilityRepo.create({
      consultantId: consultant.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: true as any,
    }));

    return this.availabilityRepo.save(slots);
  }

  async getAvailability(consultantId: number) {
    return this.availabilityRepo.find({
      where: { consultantId, isActive: true as any },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  ADMIN: CONSULTANT APPROVAL
  // ═══════════════════════════════════════════════════════════

  async adminListConsultants(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [items, total] = await this.consultantRepo.findAndCount({
      where,
      relations: ['user', 'documents'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminReviewConsultant(consultantId: number, dto: AdminReviewConsultantDto) {
    const consultant = await this.consultantRepo.findOne({
      where: { id: consultantId },
      relations: ['user'],
    });
    if (!consultant) throw new NotFoundException('Consultant not found');

    consultant.status = dto.decision;

    if (dto.decision === 'approved') {
      consultant.approvedAt = new Date();
      // Mark user as a consultant — visible across the platform
      if (consultant.user) {
        await this.usersRepo.update(consultant.userId, { isConsultant: true });
      }
    } else {
      consultant.rejectionReason = dto.rejectionReason ?? null;
      // Revoke consultant badge if rejected or suspended
      if (consultant.user) {
        await this.usersRepo.update(consultant.userId, { isConsultant: false });
      }

      // H15 — Cancel all confirmed/pending bookings and notify clients
      const activeBookings = await this.bookingRepo.find({
        where: { consultantId: consultant.id, status: In(['pending', 'confirmed']) },
        relations: ['client'],
      });
      if (activeBookings.length > 0) {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const browsUrl = `${fe.replace(/\/+$/, '')}/en/consultations`;
        for (const booking of activeBookings) {
          booking.status = 'cancelled';
          (booking as any).paymentStatus = 'refund_pending';
          await this.bookingRepo.save(booking);

          if (booking.client) {
            // In-app notification
            await this.notificationsService.create(
              booking.clientId,
              'consultation_cancelled',
              'Your consultation booking was cancelled',
              'تم إلغاء حجز الاستشارة الخاص بك',
              `${consultant.displayName}'s account has been suspended. Your booking has been cancelled and a refund will be processed.`,
              `تم تعليق حساب ${consultant.displayName}. تم إلغاء حجزك وسيتم استرداد المبلغ.`,
              { bookingId: booking.id },
            );

            // Email notification
            try {
              const scheduledLabel = booking.scheduledAt
                ? new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                : 'TBD';
              await this.mail.send(
                booking.client.email,
                'Your consultation booking has been cancelled — Oikivo',
                tplConsultantSuspendedClientNotice(
                  booking.client.firstName,
                  consultant.displayName,
                  scheduledLabel,
                  `#${booking.id}`,
                  browsUrl,
                ),
              );
            } catch { /* non-blocking */ }
          }
        }
      }
    }

    const saved = await this.consultantRepo.save(consultant);

    // Notify the user
    const title = dto.decision === 'approved'
      ? 'Congratulations! Your consultant application is approved'
      : 'Your consultant application was not approved';
    const titleAr = dto.decision === 'approved'
      ? 'تهانينا! تم قبول طلب الاستشارات الخاص بك'
      : 'لم يتم قبول طلب الاستشارات الخاص بك';

    await this.notificationsService.create(
      consultant.userId,
      'consultant_approved', // distinct notification type for consultant approval
      title,
      titleAr,
      dto.decision === 'approved'
        ? 'You can now offer consultation services on Oikivo!'
        : `Reason: ${dto.rejectionReason ?? 'Not specified'}`,
      dto.decision === 'approved'
        ? 'يمكنك الآن تقديم خدمات الاستشارات على Oikivo!'
        : `السبب: ${dto.rejectionReason ?? 'غير محدد'}`,
      { consultantId: consultant.id },
    );

    // C9: Send decision email to consultant
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const feBase = fe.replace(/\/+$/, '');
      const consultantUser = consultant.user ?? await this.usersRepo.findOne({ where: { id: consultant.userId } });
      if (consultantUser) {
        await this.mail.send(
          consultantUser.email,
          dto.decision === 'approved'
            ? 'Your Oikivo consultant application is approved! 🎉'
            : 'Update on your Oikivo consultant application',
          tplConsultantApplicationDecision(
            consultantUser.firstName,
            dto.decision as 'approved' | 'rejected' | 'suspended',
            dto.rejectionReason ?? null,
            `${feBase}/en/consultations/dashboard`,
            `${feBase}/en/consultations/apply`,
          ),
        );
      }
    } catch { /* non-blocking */ }

    // C11: When approved, notify past clients who had bookings with this consultant
    if (dto.decision === 'approved') {
      try {
        const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        const feBase = fe.replace(/\/+$/, '');
        const pastBookings = await this.bookingRepo.find({
          where: { consultantId: consultant.id },
          relations: ['client'],
        });
        const notifiedClientIds = new Set<number>();
        for (const booking of pastBookings) {
          if (!booking.client || notifiedClientIds.has(booking.clientId)) continue;
          notifiedClientIds.add(booking.clientId);
          await this.notificationsService.create(
            booking.clientId,
            'consultant_approved',
            `${consultant.displayName} is now a verified consultant`,
            `${consultant.displayName} أصبح الآن مستشاراً موثقاً`,
            `You can now book a consultation session with ${consultant.displayName}.`,
            `يمكنك الآن حجز جلسة استشارية مع ${consultant.displayName}.`,
            { consultantId: consultant.id },
          );
          try {
            await this.mail.send(
              booking.client.email,
              `${consultant.displayName} is now available on Oikivo — Oikivo`,
              tplConsultantApprovedClientNotice(
                booking.client.firstName,
                consultant.displayName,
                `${feBase}/en/consultations/${consultant.uuid}`,
              ),
            );
          } catch { /* non-blocking */ }
        }
      } catch { /* non-blocking */ }
    }

    return saved;
  }

  async adminGetConsultantDetail(consultantId: number) {
    const consultant = await this.consultantRepo.findOne({
      where: { id: consultantId },
      relations: ['user', 'documents'],
    });
    if (!consultant) throw new NotFoundException('Consultant not found');
    return consultant;
  }

  async adminGetStats() {
    const total = await this.consultantRepo.count();
    const pending = await this.consultantRepo.count({ where: { status: 'pending' } });
    const approved = await this.consultantRepo.count({ where: { status: 'approved' } });
    const totalBookings = await this.bookingRepo.count();
    const completedBookings = await this.bookingRepo.count({ where: { status: 'completed' } });

    // Calculate total platform revenue
    const { revenue } = await this.bookingRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.platform_fee), 0)', 'revenue')
      .where('b.status = :status', { status: 'completed' })
      .getRawOne();

    return {
      consultants: { total, pending, approved },
      bookings: { total: totalBookings, completed: completedBookings },
      platformRevenue: Number(revenue),
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════

  // G22: Resolve a local time string (HH:mm) on a given date in the consultant's timezone to a UTC Date.
  private localTimeToUtc(dateStr: string, timeStr: string, timezone: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    // Create a draft UTC timestamp using the given time as-if it were UTC
    const draft = new Date(Date.UTC(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(5, 7)) - 1,
      parseInt(dateStr.slice(8, 10)),
      h, m, 0,
    ));
    try {
      // formatToParts gives us the wall-clock value in the target timezone for this UTC instant
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(draft);
      const get = (type: string) => {
        const v = parts.find(p => p.type === type)?.value;
        return v ? parseInt(v) : 0;
      };
      const tzAsUtc = new Date(Date.UTC(
        get('year'), get('month') - 1, get('day'),
        get('hour') % 24, get('minute'), get('second'),
      ));
      // offset = how far the timezone is ahead of UTC at this moment
      // tzAsUtc represents the wall-clock time in the timezone, expressed as UTC
      // We want: UTC_result = draft - (tzAsUtc - draft) = 2*draft - tzAsUtc
      const offsetMs = tzAsUtc.getTime() - draft.getTime();
      return new Date(draft.getTime() - offsetMs);
    } catch {
      // Fallback: treat as UTC if timezone is invalid
      return draft;
    }
  }

  async getAvailableSlots(
    consultantId: number,
    date: string,
    durationMinutes: number,
    clientTimezone?: string,
  ): Promise<{ slots: string[]; consultantTimezone: string }> {
    const dateObj = new Date(date + 'T00:00:00Z');
    const dayOfWeek = dateObj.getUTCDay(); // 0=Sunday … 6=Saturday

    const consultant = await this.consultantRepo.findOne({ where: { id: consultantId } });
    const consultantTimezone = consultant?.timezone ?? 'UTC';

    const windows = await this.availabilityRepo.find({
      where: { consultantId, dayOfWeek, isActive: true as any },
    });
    if (!windows.length) return { slots: [], consultantTimezone };

    // C4: Check if the date falls within any vacation / out-of-office block
    const vacationBlock = await this.vacationRepo
      .createQueryBuilder('v')
      .where('v.consultant_id = :cid', { cid: consultantId })
      .andWhere(':date BETWEEN v.start_date AND v.end_date', { date })
      .getOne();
    if (vacationBlock) return { slots: [], consultantTimezone };

    // Build day boundaries in the consultant's timezone → UTC
    const dayStartUtc = this.localTimeToUtc(date, '00:00', consultantTimezone);
    const dayEndUtc   = this.localTimeToUtc(date, '23:59', consultantTimezone);

    const existingBookings = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.consultant_id = :cid', { cid: consultantId })
      .andWhere('b.scheduled_at BETWEEN :start AND :end', { start: dayStartUtc, end: dayEndUtc })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: ['cancelled', 'no_show'] })
      .getMany();

    const now   = new Date();
    const durMs = durationMinutes * 60 * 1000;
    const slots: string[] = [];

    for (const window of windows) {
      // Convert consultant local window times to UTC
      const winStart = this.localTimeToUtc(date, window.startTime, consultantTimezone);
      const winEnd   = this.localTimeToUtc(date, window.endTime,   consultantTimezone);

      let cursor = new Date(winStart);
      while (cursor.getTime() + durMs <= winEnd.getTime()) {
        const slotEnd = new Date(cursor.getTime() + durMs);

        if (cursor > now) {
          const conflict = existingBookings.some(b => {
            const bs = new Date(b.scheduledAt);
            const be = new Date(bs.getTime() + b.durationMinutes * 60 * 1000);
            return cursor < be && slotEnd > bs;
          });
          if (!conflict) slots.push(cursor.toISOString());
        }

        cursor = new Date(cursor.getTime() + durMs);
      }
    }

    return { slots, consultantTimezone };
  }

  async getConsultantStats(userId: number) {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) throw new NotFoundException('Consultant profile not found');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [totalSessions, pendingCount, confirmedCount, cancelledCount] = await Promise.all([
      this.bookingRepo.count({ where: { consultantId: consultant.id, status: 'completed' } }),
      this.bookingRepo.count({ where: { consultantId: consultant.id, status: 'pending' } }),
      this.bookingRepo.count({ where: { consultantId: consultant.id, status: 'confirmed' } }),
      this.bookingRepo.count({ where: { consultantId: consultant.id, status: In(['cancelled', 'no_show']) } }),
    ]);

    const completionRate =
      totalSessions + cancelledCount > 0
        ? Math.round((totalSessions / (totalSessions + cancelledCount)) * 100)
        : 100;

    const [earningsRow, busiestHourRow, earningsByMonthRaw] = await Promise.all([
      this.bookingRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.consultant_payout), 0)', 'total')
        .where('b.consultant_id = :cid', { cid: consultant.id })
        .andWhere('b.status = :s', { s: 'completed' })
        .getRawOne<{ total: string }>(),

      this.bookingRepo
        .createQueryBuilder('b')
        .select('HOUR(b.scheduled_at)', 'hour')
        .addSelect('COUNT(*)', 'count')
        .where('b.consultant_id = :cid', { cid: consultant.id })
        .groupBy('HOUR(b.scheduled_at)')
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne<{ hour: number; count: string }>(),

      this.bookingRepo
        .createQueryBuilder('b')
        .select("DATE_FORMAT(b.scheduled_at, '%Y-%m')", 'month')
        .addSelect('COALESCE(SUM(b.consultant_payout), 0)', 'earnings')
        .where('b.consultant_id = :cid', { cid: consultant.id })
        .andWhere('b.status = :s', { s: 'completed' })
        .andWhere('b.scheduled_at >= :since', { since: sixMonthsAgo })
        .groupBy("DATE_FORMAT(b.scheduled_at, '%Y-%m')")
        .orderBy('month', 'ASC')
        .getRawMany<{ month: string; earnings: string }>(),
    ]);

    const upcomingBookings = await this.bookingRepo.find({
      where: { consultantId: consultant.id, status: In(['pending', 'confirmed']) },
      relations: ['client'],
      order: { scheduledAt: 'ASC' },
      take: 10,
    });

    const recentReviews = await this.reviewRepo.find({
      where: { consultantId: consultant.id },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      overview: {
        totalSessions,
        pendingCount,
        confirmedCount,
        totalEarnings: Number(earningsRow?.total ?? 0),
        avgRating: Number(consultant.avgRating),
        reviewCount: consultant.reviewCount,
        completionRate,
        busiestHour: busiestHourRow?.hour ?? null,
        earningsByMonth: earningsByMonthRaw.map((r) => ({
          month: r.month,
          earnings: Number(r.earnings),
        })),
      },
      upcomingBookings,
      recentReviews,
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  CONSULTATION SERVICES CRUD
  // ═══════════════════════════════════════════════════════════

  async createService(userId: number, dto: CreateConsultationServiceDto): Promise<ConsultationServiceEntity> {
    const consultant = await this.getApprovedConsultant(userId);
    const service = this.serviceRepo.create({
      consultantId: consultant.id,
      title: dto.title,
      titleAr: dto.titleAr,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      category: dto.category,
      durationMinutes: dto.durationMinutes,
      price: dto.price,
      currency: dto.currency ?? 'EGP',
      deliveryMode: dto.deliveryMode ?? 'video_call',
      maxBookingsPerDay: dto.maxBookingsPerDay ?? 5,
      isActive: true,
    });
    return this.serviceRepo.save(service);
  }

  async getMyServices(userId: number): Promise<ConsultationServiceEntity[]> {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) return [];
    return this.serviceRepo.find({ where: { consultantId: consultant.id }, order: { createdAt: 'DESC' } });
  }

  async getConsultantServices(consultantId: number): Promise<ConsultationServiceEntity[]> {
    return this.serviceRepo.find({ where: { consultantId, isActive: true }, order: { price: 'ASC' } });
  }

  async updateService(userId: number, serviceId: number, dto: UpdateConsultationServiceDto): Promise<ConsultationServiceEntity> {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) throw new NotFoundException('Consultant profile not found');
    const service = await this.serviceRepo.findOne({ where: { id: serviceId, consultantId: consultant.id } });
    if (!service) throw new NotFoundException('Consultation service not found');
    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  async deleteService(userId: number, serviceId: number): Promise<{ message: string }> {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) throw new NotFoundException('Consultant profile not found');
    const service = await this.serviceRepo.findOne({ where: { id: serviceId, consultantId: consultant.id } });
    if (!service) throw new NotFoundException('Consultation service not found');
    service.isActive = false;
    await this.serviceRepo.save(service);
    return { message: 'Service deactivated' };
  }

  // ═══════════════════════════════════════════════════════════
  //  C4 — VACATION / OUT-OF-OFFICE BLOCKING
  // ═══════════════════════════════════════════════════════════

  async blockVacation(userId: number, dto: BlockVacationDto) {
    const consultant = await this.getApprovedConsultant(userId);
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('Start date must be on or before end date');
    }
    return this.vacationRepo.save(
      this.vacationRepo.create({
        consultantId: consultant.id,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason ?? null,
      }),
    );
  }

  async getMyVacations(userId: number) {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) return [];
    return this.vacationRepo.find({
      where: { consultantId: consultant.id },
      order: { startDate: 'ASC' },
    });
  }

  async deleteVacation(userId: number, blockId: number) {
    const consultant = await this.getApprovedConsultant(userId);
    const block = await this.vacationRepo.findOne({
      where: { id: blockId, consultantId: consultant.id },
    });
    if (!block) throw new NotFoundException('Vacation block not found');
    await this.vacationRepo.delete(block.id);
    return { message: 'Vacation block deleted' };
  }

  // ═══════════════════════════════════════════════════════════
  //  C7 — REVIEW FLAGGING
  // ═══════════════════════════════════════════════════════════

  async flagReview(userId: number, reviewId: number, reason: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (!reason?.trim()) throw new BadRequestException('Reason is required');

    // Notify all admin users so they can moderate in the C8 admin panel
    const admins = await this.usersRepo.find({ where: { isAdmin: true } });
    await Promise.all(
      admins.map((admin) =>
        this.notificationsService.create(
          admin.id,
          'review_flagged',
          `Consultation review #${reviewId} flagged`,
          `تم الإبلاغ عن التقييم #${reviewId}`,
          `Review #${reviewId} was flagged by user #${userId}. Reason: ${reason}`,
          `تم الإبلاغ عن التقييم #${reviewId} من المستخدم #${userId}. السبب: ${reason}`,
          { consultationReviewId: reviewId },
        ),
      ),
    );

    return { message: 'Review has been flagged. Our team will review it shortly.' };
  }

  // ═══════════════════════════════════════════════════════════
  //  C8 — ADMIN CONSULTATION REVIEW MODERATION
  // ═══════════════════════════════════════════════════════════

  async adminGetConsultationReviews(page = 1, limit = 20) {
    const [items, total] = await this.reviewRepo.findAndCount({
      relations: ['reviewer', 'consultant', 'consultant.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminToggleReviewHidden(reviewId: number) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    review.isHidden = !review.isHidden as any;
    return this.reviewRepo.save(review);
  }

  // ═══════════════════════════════════════════════════════════
  //  C12: PAYOUT FLOW
  // ═══════════════════════════════════════════════════════════

  /** Release held earnings to 'available' after 48h — called by scheduler */
  async releaseConsultantEarningsHold() {
    const now = new Date();
    const held = await this.earningRepo
      .createQueryBuilder('e')
      .where('e.status = :s', { s: 'hold' })
      .andWhere('e.available_at <= :now', { now })
      .getMany();
    for (const e of held) {
      e.status = 'available';
      await this.earningRepo.save(e);
    }
  }

  /** Consultant saves payout preference to their profile */
  async updatePayoutSettings(userId: number, dto: UpdateConsultantPayoutSettingsDto) {
    const consultant = await this.getApprovedConsultant(userId);
    consultant.payoutMethod = dto.method;
    consultant.payoutAccountDetails = dto.accountDetails;
    return this.consultantRepo.save(consultant);
  }

  /** Consultant views their earnings summary */
  async getMyEarnings(userId: number) {
    const consultant = await this.getApprovedConsultant(userId);
    const earnings = await this.earningRepo.find({
      where: { consultantId: consultant.id },
      order: { createdAt: 'DESC' },
    });
    const holdBalance = earnings
      .filter((e) => e.status === 'hold')
      .reduce((s, e) => s + Number(e.amount), 0);
    const availableBalance = earnings
      .filter((e) => e.status === 'available')
      .reduce((s, e) => s + Number(e.amount), 0);
    const lifetimePaid = earnings
      .filter((e) => e.status === 'paid')
      .reduce((s, e) => s + Number(e.amount), 0);
    const pendingRequests = await this.payoutRepo.find({
      where: { consultantId: consultant.id, status: 'pending' },
    });
    const pendingRequestTotal = pendingRequests.reduce((s, p) => s + Number(p.amount), 0);
    return {
      holdBalance,
      availableBalance,
      lifetimePaid,
      pendingRequestTotal,
      currency: consultant.currency ?? 'EGP',
      payoutMethod: consultant.payoutMethod,
      payoutAccountDetails: consultant.payoutAccountDetails,
      recentEarnings: earnings.slice(0, 20),
    };
  }

  /** Consultant requests a payout of available balance */
  async requestPayout(userId: number, dto: RequestConsultantPayoutDto) {
    const consultant = await this.getApprovedConsultant(userId);

    const availableBalance = await this.earningRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .where('e.consultant_id = :id', { id: consultant.id })
      .andWhere('e.status = :s', { s: 'available' })
      .getRawOne()
      .then((r) => Number(r?.total ?? 0));

    if (dto.amount > availableBalance) {
      throw new BadRequestException(
        `Requested amount (${dto.amount}) exceeds available balance (${availableBalance.toFixed(2)})`,
      );
    }

    // Create payout request
    const request = await this.payoutRepo.save(
      this.payoutRepo.create({
        consultantId: consultant.id,
        amount: dto.amount,
        currency: consultant.currency ?? 'EGP',
        method: dto.method ?? consultant.payoutMethod ?? 'instapay',
        accountDetails: dto.accountDetails ?? consultant.payoutAccountDetails ?? null,
        status: 'pending',
      }),
    );

    // Mark corresponding earnings as 'paid' (deduct from available balance)
    const availableEarnings = await this.earningRepo.find({
      where: { consultantId: consultant.id, status: 'available' },
      order: { createdAt: 'ASC' },
    });
    let remaining = dto.amount;
    for (const e of availableEarnings) {
      if (remaining <= 0) break;
      e.status = 'paid';
      await this.earningRepo.save(e);
      remaining -= Number(e.amount);
    }

    // Notify admins
    const admins = await this.usersRepo.find({ where: { isAdmin: true } });
    for (const admin of admins) {
      await this.notificationsService.create(
        admin.id,
        'consultant_payout_request',
        'New consultant payout request',
        'طلب سحب جديد من مستشار',
        `${consultant.displayName} requested a payout of ${dto.amount} ${consultant.currency ?? 'EGP'}`,
        `${consultant.displayName} طلب سحب ${dto.amount} ${consultant.currency ?? 'EGP'}`,
        { consultantId: consultant.id, payoutRequestId: request.id },
      );
    }

    return request;
  }

  /** Consultant views own payout requests */
  async getMyPayoutRequests(userId: number) {
    const consultant = await this.getApprovedConsultant(userId);
    return this.payoutRepo.find({
      where: { consultantId: consultant.id },
      order: { createdAt: 'DESC' },
    });
  }

  /** Admin: list all consultant payout requests */
  async adminListConsultantPayouts(params: { page?: number; status?: string }) {
    const page = params.page ?? 1;
    const limit = 25;
    const qb = this.payoutRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.consultant', 'c')
      .leftJoinAndSelect('c.user', 'u')
      .orderBy('r.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (params.status) qb.where('r.status = :s', { s: params.status });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  /** Admin: approve or reject a consultant payout request */
  async adminProcessConsultantPayout(requestId: number, dto: AdminProcessConsultantPayoutDto) {
    const request = await this.payoutRepo.findOne({
      where: { id: requestId },
      relations: ['consultant', 'consultant.user'],
    });
    if (!request) throw new NotFoundException('Payout request not found');
    if (request.status !== 'pending' && request.status !== 'processing') {
      throw new BadRequestException('This payout request cannot be updated');
    }

    request.status = dto.status;
    request.note = dto.note ?? null;
    if (dto.status === 'completed' || dto.status === 'failed') {
      request.processedAt = new Date();
    }

    // If failed, refund earnings back to 'available'
    if (dto.status === 'failed') {
      const paidEarnings = await this.earningRepo.find({
        where: { consultantId: request.consultantId, status: 'paid' },
        order: { createdAt: 'DESC' },
      });
      let refund = Number(request.amount);
      for (const e of paidEarnings) {
        if (refund <= 0) break;
        e.status = 'available';
        await this.earningRepo.save(e);
        refund -= Number(e.amount);
      }
    }

    await this.payoutRepo.save(request);

    // Email consultant about the outcome
    try {
      const fe = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const feBase = fe.replace(/\/+$/, '');
      const consultantUser = request.consultant?.user;
      if (consultantUser) {
        await this.mail.send(
          consultantUser.email,
          dto.status === 'completed'
            ? 'Your payout has been processed — Oikivo'
            : 'Payout processing update — Oikivo',
          tplConsultantPayoutProcessed(
            request.consultant.displayName,
            Number(request.amount).toFixed(2),
            request.currency,
            request.method,
            dto.status as 'completed' | 'failed',
            dto.note ?? null,
            `${feBase}/en/consultations/dashboard`,
          ),
        );
      }
    } catch { /* non-blocking */ }

    return request;
  }

  private async getApprovedConsultant(userId: number): Promise<ConsultantEntity> {
    if (!consultant) throw new NotFoundException('Consultant profile not found');
    if (consultant.status !== 'approved') throw new ForbiddenException('Your consultant profile is not approved yet');
    return consultant;
  }
}