import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ConsultantEntity } from '../entities/consultant.entity';
import { ConsultantDocumentEntity } from '../entities/consultant-document.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { ConsultationReviewEntity } from '../entities/consultation-review.entity';
import { ConsultantAvailabilityEntity } from '../entities/consultant-availability.entity';
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
  BlockVacationDto, RequestConsultantPayoutDto, UpdateConsultantPayoutSettingsDto,
  AdminProcessConsultantPayoutDto, AdminMarkNoShowDto, AdminResolveDisputeDto,
  RescheduleBookingDto,
} from './dto/consultations.dto';

const PLATFORM_FEE_PERCENT = 0.10; // 10% deducted from consultant payout only; client pays face value

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);

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
    private dataSource: DataSource,
  ) {}

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  CONSULTANT APPLICATION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
    if (['suspended', 'rejected'].includes(consultant.status)) {
      throw new ForbiddenException('Suspended or rejected consultants cannot update profile until reinstated');
    }

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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  BROWSE CONSULTANTS (PUBLIC)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  async listConsultants(filters: {
    specialization?: string;
    minRating?: number;
    maxPrice?: number;
    search?: string;
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
    if (filters.search) {
      qb.andWhere('(c.displayName LIKE :search OR u.firstName LIKE :search OR u.lastName LIKE :search)', { search: `%${filters.search}%` });
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

    // Load reviews (exclude admin-hidden ones for public view)
    const reviews = await this.reviewRepo.find({
      where: { consultantId, isHidden: false as any },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    // Load availability
    const availability = await this.availabilityRepo.find({
      where: { consultantId, isActive: true as any },
    });

    return { consultant, reviews, availability };
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  BOOKING A CONSULTATION (client = host seeking help)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

    // BUG-C2: Check for overlapping bookings (double-booking prevention)
    const durationMs = (dto.durationMinutes) * 60 * 1000;
    const newEnd = new Date(scheduledAt.getTime() + durationMs);
    const overlap = await this.bookingRepo.createQueryBuilder('b')
      .where('b.consultant_id = :cid', { cid: consultant.id })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: ['cancelled', 'no_show'] })
      .andWhere('b.scheduled_at < :newEnd', { newEnd })
      .andWhere('DATE_ADD(b.scheduled_at, INTERVAL b.duration_minutes MINUTE) > :newStart', { newStart: scheduledAt })
      .getCount();
    if (overlap > 0) {
      throw new BadRequestException('This time slot overlaps with an existing booking');
    }

    // BUG-C3: Enforce consultant availability windows + vacation blocks
    const dateStr = scheduledAt.toISOString().slice(0, 10); // YYYY-MM-DD
    const availableSlots = await this.getAvailableSlots(
      consultant.id,
      dateStr,
      dto.durationMinutes,
    );
    const requestedIso = scheduledAt.toISOString();
    if (!availableSlots.slots.includes(requestedIso)) {
      throw new BadRequestException(
        'The requested time slot is not within the consultant\'s available hours or falls during a vacation block',
      );
    }

    const deliveryMode = dto.deliveryMode ?? 'video_call';

    // C5: Calculate price from hourly rate (consultation_services table removed in migration_053)
    const durationMinutes = dto.durationMinutes;
    const basePrice = Math.round(Number(consultant.hourlyRate) * (durationMinutes / 60) * 100) / 100;

    // Platform takes 10% from the consultant payout only; client pays face value
    const price = basePrice;
    const platformFee = Math.round(basePrice * PLATFORM_FEE_PERCENT * 100) / 100;
    const consultantPayout = Math.round((basePrice - platformFee) * 100) / 100;

    const booking = this.bookingRepo.create({
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
      paymentMethod: 'instapay', // Egypt launch: InstaPay only
      clientNote: dto.clientNote,
      // P4: Payment deadline — auto-cancel if unpaid after 2 hours
      paymentDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
    } as any);

    const saved = await this.bookingRepo.save(booking) as unknown as ConsultationBookingEntity;

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
      'Ø·Ù„Ø¨ Ø­Ø¬Ø² Ø§Ø³ØªØ´Ø§Ø±Ø© Ø¬Ø¯ÙŠØ¯',
      `You have a new consultation booking request`,
      `Ù„Ø¯ÙŠÙƒ Ø·Ù„Ø¨ Ø­Ø¬Ø² Ø§Ø³ØªØ´Ø§Ø±Ø© Ø¬Ø¯ÙŠØ¯`,
      { consultationBookingId: saved.id },
    );

    // Send emails
    try {
      const feBase = this.getFrontendBaseUrl();
      const instapayPhone = this.configService.get<string>('INSTAPAY_PHONE');
      const instapayName = this.configService.get<string>('INSTAPAY_NAME', 'Oikivo Platform');
      if (!instapayPhone) {
        Logger.warn('INSTAPAY_PHONE env var not configured — client booking email will be missing payment details');
      }
      const scheduledLabel = new Date(scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
      const bookingRef = `CONSULT-${saved.id}`;
      const sessionLabel = `${durationMinutes} min Consultation`;

      if (consultantUser) {
        await this.mail.send(
          consultantUser.email,
          'New consultation booking request â€” Oikivo',
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
            'Complete your InstaPay payment â€” Oikivo',
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
            'Consultation request submitted â€” Oikivo',
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
      // Non-blocking â€” booking is already saved; log and continue
    }

    return saved;
  }

  async markInstapayPaid(consultantUserId: number, bookingId: number) {
    const consultant = await this.getApprovedConsultant(consultantUserId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, consultantId: consultant.id },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    // BUG-H1: Prevent marking cancelled/no_show bookings as paid
    if (['cancelled', 'no_show'].includes(booking.status)) {
      throw new BadRequestException('Cannot confirm payment on a cancelled or no-show booking');
    }
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
      const feBase = this.getFrontendBaseUrl();
      const [consultantUser, client] = await Promise.all([
        this.usersRepo.findOne({ where: { id: consultant.userId } }),
        this.usersRepo.findOne({ where: { id: booking.clientId } }),
      ]);
      if (consultantUser) {
        const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
        const sessionLabel = `${booking.durationMinutes} min Consultation`;
        await this.mail.send(
          consultantUser.email,
          'Payment confirmed for your consultation booking â€” Oikivo',
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
    } catch (e) { this.logger.warn(`Non-blocking booking email error: ${e?.message}`); }

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
      // BUG-L3: Validate meeting link format for video_call delivery mode
      if (dto.meetingLink && booking.deliveryMode === 'video_call') {
        try {
          const url = new URL(dto.meetingLink);
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error('Invalid protocol');
          }
        } catch {
          throw new BadRequestException('Meeting link must be a valid URL (https://...) for video call sessions');
        }
      }
      booking.status = 'confirmed';
      booking.meetingLink = dto.meetingLink ?? null;
      booking.consultantNote = dto.consultantNote ?? null;

      await this.notificationsService.create(
        booking.clientId,
        'booking_confirmed',
        'Consultation booking confirmed!',
        'ØªÙ… ØªØ£ÙƒÙŠØ¯ Ø­Ø¬Ø² Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø©!',
        `Your consultation has been confirmed`,
        `ØªÙ… ØªØ£ÙƒÙŠØ¯ Ø§Ø³ØªØ´Ø§Ø±ØªÙƒ`,
        { consultationBookingId: booking.id },
      );

      // Send confirmation email to client
      try {
        const feBase = this.getFrontendBaseUrl();
        const [client, consultantUser] = await Promise.all([
          this.usersRepo.findOne({ where: { id: booking.clientId } }),
          this.usersRepo.findOne({ where: { id: userId } }),
        ]);
        if (client) {
          const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
          const sessionLabel = `${booking.durationMinutes} min Consultation`;
          await this.mail.send(
            client.email,
            'Your consultation is confirmed! â€” Oikivo',
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
              'Payment confirmed for your consultation booking â€” Oikivo',
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
          } catch (e) { this.logger.warn(`Non-blocking respond email error: ${e?.message}`); }
        }
      } catch (e) { this.logger.warn(`Non-blocking respond notification error: ${e?.message}`); }
    } else {
      booking.status = 'cancelled';
      booking.cancelledBy = 'consultant';
      booking.cancellationReason = dto.cancellationReason ?? null;

      // BUG-C4: Trigger refund when consultant declines a paid/submitted booking
      if (['paid', 'submitted'].includes(booking.paymentStatus)) {
        booking.refundAmount = Number(booking.price);
        booking.cancellationFee = 0;
        booking.paymentStatus = 'refund_pending';
      }

      await this.notificationsService.create(
        booking.clientId,
        'booking_declined',
        'Consultation booking declined',
        'ØªÙ… Ø±ÙØ¶ Ø­Ø¬Ø² Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø©',
        `Your consultation booking was declined`,
        `ØªÙ… Ø±ÙØ¶ Ø­Ø¬Ø² Ø§Ø³ØªØ´Ø§Ø±ØªÙƒ`,
        { consultationBookingId: booking.id },
      );

      // Send decline email to client
      try {
        const feBase = this.getFrontendBaseUrl();
        const client = await this.usersRepo.findOne({ where: { id: booking.clientId } });
        if (client) {
          const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
          const sessionLabel = `${booking.durationMinutes} min Consultation`;
          await this.mail.send(
            client.email,
            'Consultation request declined â€” Oikivo',
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
      } catch (e) { this.logger.warn(`Non-blocking cancel email error: ${e?.message}`); }
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

    // BUG-C1: Payment must be verified before completing
    if (booking.paymentStatus !== 'paid') {
      throw new BadRequestException('Payment must be verified before completing the session');
    }

    // BUG-5: Cannot complete before scheduled end time
    const scheduledEnd = new Date(new Date(booking.scheduledAt).getTime() + booking.durationMinutes * 60 * 1000);
    if (scheduledEnd > new Date()) {
      throw new BadRequestException('Cannot mark a session as completed before its scheduled end time');
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
    } catch (e) { this.logger.warn(`Non-blocking earning creation error: ${e?.message}`); }

    // Send completion + review prompt email to client
    try {
      const feBase = this.getFrontendBaseUrl();
      const client = await this.usersRepo.findOne({ where: { id: booking.clientId } });
      if (client) {
        const sessionLabel = `${booking.durationMinutes} min Consultation`;
        await this.mail.send(
          client.email,
          'Session completed â€” please leave a review! â€” Oikivo',
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
    } catch (e) { this.logger.warn(`Non-blocking completion email error: ${e?.message}`); }

    return saved;
  }

  /** BE-4: Client confirms the consultation session took place (unlocks payout; 48h auto-confirm) */
  async confirmCompletion(clientId: number, bookingId: number) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, clientId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'completed') {
      throw new BadRequestException('Booking must be completed before confirmation');
    }
    if (booking.clientConfirmedAt) {
      throw new BadRequestException('Session already confirmed');
    }
    booking.clientConfirmedAt = new Date();
    return this.bookingRepo.save(booking);
  }

  // BUG-H4: Client reports an issue with a completed session — blocks payout, creates dispute
  async reportSessionIssue(clientId: number, bookingId: number, reason: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, clientId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'completed') {
      throw new BadRequestException('Can only report issues for completed bookings');
    }
    if (booking.clientConfirmedAt) {
      throw new BadRequestException('Session already confirmed — cannot report an issue');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('A reason is required');
    }

    booking.status = 'disputed';
    booking.cancellationReason = reason.trim();
    await this.bookingRepo.save(booking);

    // Notify admins
    const admins = await this.usersRepo.find({ where: { isAdmin: true } });
    for (const admin of admins) {
      await this.notificationsService.create(
        admin.id,
        'session_disputed',
        'Client reported session issue',
        '\u0623\u0628\u0644\u063A \u0627\u0644\u0639\u0645\u064A\u0644 \u0639\u0646 \u0645\u0634\u0643\u0644\u0629 \u0641\u064A \u0627\u0644\u062C\u0644\u0633\u0629',
        `Client reported an issue with booking #${bookingId}: ${reason}`,
        `\u0623\u0628\u0644\u063A \u0627\u0644\u0639\u0645\u064A\u0644 \u0639\u0646 \u0645\u0634\u0643\u0644\u0629 \u0641\u064A \u0627\u0644\u062D\u062C\u0632 #${bookingId}: ${reason}`,
        { consultationBookingId: bookingId },
      );
    }

    return { message: 'Issue reported. Our team will investigate and get back to you.' };
  }

  async cancelBooking(userId: number, bookingId: number, reason?: string) {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(ConsultationBookingEntity);
      const booking = await bookingRepo.findOne({ where: { id: bookingId } });
      if (!booking) throw new NotFoundException('Booking not found');

      const isClient = booking.clientId === userId;
      const consultant = await manager.getRepository(ConsultantEntity).findOne({ where: { userId } });
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
          // Full refund â€” cancelled well in advance
          booking.refundAmount = Number(booking.price);
          booking.cancellationFee = 0;
          booking.paymentStatus = 'refund_pending';
        } else if (hoursUntilSession >= 1) {
          // 50% refund â€” cancelled same-day but not last minute
          booking.refundAmount = Math.round(Number(booking.price) * 0.5 * 100) / 100;
          booking.cancellationFee = Math.round(Number(booking.price) * 0.5 * 100) / 100;
          booking.paymentStatus = 'refund_pending';
        }
        // else: < 1 hour before session â€” no refund, paymentStatus stays 'paid'
      }

      // BUG-6: Full refund when consultant cancels a paid booking
      if (isConsultant && ['paid', 'hold'].includes(booking.paymentStatus)) {
        booking.refundAmount = Number(booking.price);
        booking.cancellationFee = 0;
        booking.paymentStatus = 'refund_pending';
      }

      return bookingRepo.save(booking);
    });
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
        'InstaPay proof received â€” please verify',
        'ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø¥Ø«Ø¨Ø§Øª InstaPay â€” ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªØ­Ù‚Ù‚',
        `Client submitted an InstaPay reference for booking #${booking.id}. Reference: ${dto.reference}. Please verify and confirm.`,
        `Ù‚Ø¯Ù‘Ù… Ø§Ù„Ø¹Ù…ÙŠÙ„ Ù…Ø±Ø¬Ø¹ Ø¯ÙØ¹ InstaPay Ù„Ù„Ø­Ø¬Ø² #${booking.id}. Ø§Ù„Ù…Ø±Ø¬Ø¹: ${dto.reference}. ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„ØªØ£ÙƒÙŠØ¯.`,
        { consultationBookingId: booking.id },
      );
    }

    return saved;
  }

  async getMyBookingsAsClient(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.bookingRepo.findAndCount({
      where: { clientId: userId },
      relations: ['consultant', 'consultant.user'],
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
      relations: ['client'],
      order: { scheduledAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  REVIEWS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  AVAILABILITY
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  async setAvailability(userId: number, dto: SetAvailabilityDto) {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) throw new NotFoundException('Consultant profile not found');

    // BE-16: Validate startTime < endTime for each slot
    for (const s of dto.slots) {
      if (s.startTime >= s.endTime) {
        throw new BadRequestException(`startTime (${s.startTime}) must be before endTime (${s.endTime})`);
      }
    }

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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  ADMIN: CONSULTANT APPROVAL
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
      // Mark user as a consultant â€” visible across the platform
      if (consultant.user) {
        await this.usersRepo.update(consultant.userId, { isConsultant: true });
      }
    } else {
      consultant.rejectionReason = dto.rejectionReason ?? null;
      // Revoke consultant badge if rejected or suspended
      if (consultant.user) {
        await this.usersRepo.update(consultant.userId, { isConsultant: false });
      }

      // H15 â€” Cancel all confirmed/pending bookings and notify clients
      const activeBookings = await this.bookingRepo.find({
        where: { consultantId: consultant.id, status: In(['pending', 'confirmed']) },
        relations: ['client'],
      });
      if (activeBookings.length > 0) {
        const browsUrl = `${this.getFrontendBaseUrl()}/en/consultations`;
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
              'ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø­Ø¬Ø² Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø© Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ',
              `${consultant.displayName}'s account has been suspended. Your booking has been cancelled and a refund will be processed.`,
              `ØªÙ… ØªØ¹Ù„ÙŠÙ‚ Ø­Ø³Ø§Ø¨ ${consultant.displayName}. ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø­Ø¬Ø²Ùƒ ÙˆØ³ÙŠØªÙ… Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ø§Ù„Ù…Ø¨Ù„Øº.`,
              { bookingId: booking.id },
            );

            // Email notification
            try {
              const scheduledLabel = booking.scheduledAt
                ? new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                : 'TBD';
              await this.mail.send(
                booking.client.email,
                'Your consultation booking has been cancelled â€” Oikivo',
                tplConsultantSuspendedClientNotice(
                  booking.client.firstName,
                  consultant.displayName,
                  scheduledLabel,
                  `#${booking.id}`,
                  browsUrl,
                ),
              );
            } catch (e) { this.logger.warn(`Non-blocking payment email error: ${e?.message}`); }
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
      ? 'ØªÙ‡Ø§Ù†ÙŠÙ†Ø§! ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø·Ù„Ø¨ Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ'
      : 'Ù„Ù… ÙŠØªÙ… Ù‚Ø¨ÙˆÙ„ Ø·Ù„Ø¨ Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ';

    await this.notificationsService.create(
      consultant.userId,
      'consultant_approved', // distinct notification type for consultant approval
      title,
      titleAr,
      dto.decision === 'approved'
        ? 'You can now offer consultation services on Oikivo!'
        : `Reason: ${dto.rejectionReason ?? 'Not specified'}`,
      dto.decision === 'approved'
        ? 'ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¢Ù† ØªÙ‚Ø¯ÙŠÙ… Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø¹Ù„Ù‰ Oikivo!'
        : `Ø§Ù„Ø³Ø¨Ø¨: ${dto.rejectionReason ?? 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯'}`,
      { consultantId: consultant.id },
    );

    // C9: Send decision email to consultant
    try {
      const feBase = this.getFrontendBaseUrl();
      const consultantUser = consultant.user ?? await this.usersRepo.findOne({ where: { id: consultant.userId } });
      if (consultantUser) {
        await this.mail.send(
          consultantUser.email,
          dto.decision === 'approved'
            ? 'Your Oikivo consultant application is approved! ðŸŽ‰'
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
    } catch (e) { this.logger.warn(`Non-blocking decision email error: ${e?.message}`); }

    // C11: When approved, notify past clients who had bookings with this consultant
    if (dto.decision === 'approved') {
      try {
        const feBase = this.getFrontendBaseUrl();
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
            `${consultant.displayName} Ø£ØµØ¨Ø­ Ø§Ù„Ø¢Ù† Ù…Ø³ØªØ´Ø§Ø±Ø§Ù‹ Ù…ÙˆØ«Ù‚Ø§Ù‹`,
            `You can now book a consultation session with ${consultant.displayName}.`,
            `ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¢Ù† Ø­Ø¬Ø² Ø¬Ù„Ø³Ø© Ø§Ø³ØªØ´Ø§Ø±ÙŠØ© Ù…Ø¹ ${consultant.displayName}.`,
            { consultantId: consultant.id },
          );
          try {
            await this.mail.send(
              booking.client.email,
              `${consultant.displayName} is now available on Oikivo â€” Oikivo`,
              tplConsultantApprovedClientNotice(
                booking.client.firstName,
                consultant.displayName,
                `${feBase}/en/consultations/${consultant.uuid}`,
              ),
            );
          } catch (e) { this.logger.warn(`Non-blocking past client email error: ${e?.message}`); }
        }
      } catch (e) { this.logger.warn(`Non-blocking past client notification error: ${e?.message}`); }
    }

    return saved;
  }

  async adminGetConsultantDetail(consultantId: number) {
    const consultant = await this.consultantRepo.findOne({
      where: { id: consultantId },
      relations: ['user', 'documents', 'availability'],
    });
    if (!consultant) throw new NotFoundException('Consultant not found');

    // Fetch extra stats
    const [bookingCount, totalEarnings, reviewCount] = await Promise.all([
      this.bookingRepo.count({ where: { consultantId } }),
      this.bookingRepo.createQueryBuilder('b')
        .select('COALESCE(SUM(b.price), 0)', 'v')
        .where('b.consultant_id = :id', { id: consultantId })
        .andWhere('b.payment_status = :ps', { ps: 'paid' })
        .getRawOne().then((r: any) => parseFloat(r?.v ?? '0')),
      this.reviewRepo.count({ where: { consultantId } }),
    ]);

    return {
      ...consultant,
      stats: { bookingCount, totalEarnings, reviewCount },
    };
  }

  async adminUpdateConsultant(consultantId: number, dto: UpdateConsultantProfileDto & { isFeatured?: boolean; status?: string }) {
    const consultant = await this.consultantRepo.findOne({ where: { id: consultantId } });
    if (!consultant) throw new NotFoundException('Consultant not found');

    const { isFeatured, status, ...profileFields } = dto;

    // Update profile fields
    Object.assign(consultant, profileFields);

    // Toggle featured
    if (typeof isFeatured === 'boolean') {
      consultant.isFeatured = isFeatured;
    }

    // Status change (suspend/unsuspend)
    if (status && ['approved', 'suspended', 'pending'].includes(status)) {
      consultant.status = status as any;
      // Update user.isConsultant flag
      if (consultant.userId) {
        const user = await this.usersRepo.findOne({ where: { id: consultant.userId } });
        if (user) {
          user.isConsultant = status === 'approved';
          await this.usersRepo.save(user);
        }
      }
    }

    return this.consultantRepo.save(consultant);
  }

  async adminGetConsultantBookings(consultantId: number, params: { page?: number; limit?: number; status?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const qb = this.bookingRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.client', 'client')
      .where('b.consultant_id = :id', { id: consultantId })
      .orderBy('b.scheduledAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (params.status) {
      qb.andWhere('b.status = :status', { status: params.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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
  // MISS7: Admin revenue dashboard with detailed breakdown
  async adminGetRevenueStats() {
    const { totalFees } = await this.bookingRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.platform_fee), 0)', 'totalFees')
      .where('b.status = :s', { s: 'completed' })
      .getRawOne();

    const { totalRefunds } = await this.bookingRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.refund_amount), 0)', 'totalRefunds')
      .where('b.refund_amount > 0')
      .getRawOne();

    const { pendingPayouts } = await this.payoutRepo.createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'pendingPayouts')
      .where('p.status = :s', { s: 'pending' })
      .getRawOne();

    const { completedPayouts } = await this.payoutRepo.createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'completedPayouts')
      .where('p.status = :s', { s: 'approved' })
      .getRawOne();

    const monthly = await this.bookingRepo.createQueryBuilder('b')
      .select('DATE_FORMAT(b.completed_at, \'%Y-%m\')', 'month')
      .addSelect('COALESCE(SUM(b.platform_fee), 0)', 'fees')
      .addSelect('COALESCE(SUM(b.consultant_payout), 0)', 'payouts')
      .addSelect('COUNT(*)', 'bookings')
      .where('b.status = :s', { s: 'completed' })
      .andWhere('b.completed_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)')
      .groupBy('month')
      .orderBy('month', 'DESC')
      .getRawMany();

    const { pendingRefunds } = await this.bookingRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.refund_amount), 0)', 'pendingRefunds')
      .where('b.payment_status = :s', { s: 'refund_pending' })
      .getRawOne();

    return {
      totalPlatformFees: Number(totalFees),
      totalRefunds: Number(totalRefunds),
      pendingRefunds: Number(pendingRefunds),
      pendingPayouts: Number(pendingPayouts),
      completedPayouts: Number(completedPayouts),
      netRevenue: Number(totalFees) - Number(totalRefunds),
      monthly: monthly.map(m => ({
        month: m.month,
        fees: Number(m.fees),
        payouts: Number(m.payouts),
        bookings: Number(m.bookings),
      })),
    };
  }

  // MISS6: Reschedule a confirmed booking
  async rescheduleBooking(userId: number, bookingId: number, dto: RescheduleBookingDto) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['consultant', 'consultant.user', 'client'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isClient = booking.clientId === userId;
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    const isConsultant = consultant && booking.consultantId === consultant.id;
    if (!isClient && !isConsultant) throw new ForbiddenException('Not authorized');

    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed bookings can be rescheduled');
    }

    const newScheduledAt = new Date(dto.scheduledAt);
    if (newScheduledAt <= new Date()) {
      throw new BadRequestException('New scheduled time must be in the future');
    }

    const hoursUntilSession = (new Date(booking.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilSession < 2) {
      throw new BadRequestException('Cannot reschedule less than 2 hours before the session');
    }

    const dateStr = newScheduledAt.toISOString().slice(0, 10);
    const availableSlots = await this.getAvailableSlots(
      booking.consultantId,
      dateStr,
      booking.durationMinutes,
    );
    if (!availableSlots.slots.includes(newScheduledAt.toISOString())) {
      throw new BadRequestException('The new time slot is not available');
    }

    const durationMs = booking.durationMinutes * 60 * 1000;
    const newEnd = new Date(newScheduledAt.getTime() + durationMs);
    const overlap = await this.bookingRepo.createQueryBuilder('b')
      .where('b.consultant_id = :cid', { cid: booking.consultantId })
      .andWhere('b.id != :bid', { bid: booking.id })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: ['cancelled', 'no_show'] })
      .andWhere('b.scheduled_at < :newEnd', { newEnd })
      .andWhere('DATE_ADD(b.scheduled_at, INTERVAL b.duration_minutes MINUTE) > :newStart', { newStart: newScheduledAt })
      .getCount();
    if (overlap > 0) {
      throw new BadRequestException('The new time slot overlaps with another booking');
    }

    if (!booking.originalScheduledAt) {
      booking.originalScheduledAt = booking.scheduledAt;
    }
    booking.scheduledAt = newScheduledAt;
    const saved = await this.bookingRepo.save(booking);

    const rescheduledBy = isClient ? 'client' : 'consultant';
    const notifyUserId = isClient ? booking.consultant?.userId : booking.clientId;
    const scheduledLabel = newScheduledAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

    if (notifyUserId) {
      await this.notificationsService.create(
        notifyUserId,
        'booking_rescheduled',
        `Consultation rescheduled by ${rescheduledBy}`,
        `Consultation rescheduled`,
        `Your consultation has been rescheduled to ${scheduledLabel}${dto.reason ? '. Reason: ' + dto.reason : ''}`,
        `Your consultation has been rescheduled to ${scheduledLabel}`,
        { consultationBookingId: saved.id },
      );
    }

    return saved;
  }

  // MISS8: Get platform InstaPay details for client-facing display
  getInstapayDetails() {
    const phone = this.configService.get<string>('INSTAPAY_PHONE');
    const name = this.configService.get<string>('INSTAPAY_NAME');

    if (!phone) {
      throw new BadRequestException('Platform InstaPay payment details are not configured. Please contact support.');
    }

    return {
      instapayPhone: phone,
      instapayName: name ?? 'Oikivo Platform',
    };
  }



  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  HELPERS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
    const dayOfWeek = dateObj.getUTCDay(); // 0=Sunday â€¦ 6=Saturday

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

    // Build day boundaries in the consultant's timezone â†’ UTC
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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  C4 â€” VACATION / OUT-OF-OFFICE BLOCKING
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  async blockVacation(userId: number, dto: BlockVacationDto) {
    const consultant = await this.getApprovedConsultant(userId);
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('Start date must be on or before end date');
    }

    const conflicting = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.consultant_id = :cid', { cid: consultant.id })
      .andWhere('b.status = :status', { status: 'confirmed' })
      .andWhere('DATE(b.scheduled_at) BETWEEN :startDate AND :endDate', {
        startDate: dto.startDate,
        endDate: dto.endDate,
      })
      .getCount();

    if (conflicting > 0) {
      throw new BadRequestException(
        'Vacation block conflicts with existing confirmed bookings. Reschedule/cancel those bookings first.',
      );
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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  C7 â€” REVIEW FLAGGING
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
          `ØªÙ… Ø§Ù„Ø¥Ø¨Ù„Ø§Øº Ø¹Ù† Ø§Ù„ØªÙ‚ÙŠÙŠÙ… #${reviewId}`,
          `Review #${reviewId} was flagged by user #${userId}. Reason: ${reason}`,
          `ØªÙ… Ø§Ù„Ø¥Ø¨Ù„Ø§Øº Ø¹Ù† Ø§Ù„ØªÙ‚ÙŠÙŠÙ… #${reviewId} Ù…Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… #${userId}. Ø§Ù„Ø³Ø¨Ø¨: ${reason}`,
          { consultationReviewId: reviewId },
        ),
      ),
    );

    return { message: 'Review has been flagged. Our team will review it shortly.' };
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  C8 â€” ADMIN CONSULTATION REVIEW MODERATION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
    const saved = await this.reviewRepo.save(review);

    // BUG-M6: Recalculate consultant's avgRating and reviewCount from visible reviews
    await this.recalculateConsultantRating(review.consultantId);

    return saved;
  }

  /** Recalculate avgRating and reviewCount for a consultant from non-hidden reviews */
  private async recalculateConsultantRating(consultantId: number) {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('COUNT(*)', 'cnt')
      .addSelect('COALESCE(AVG(r.overall_rating), 0)', 'avg')
      .where('r.consultant_id = :cid', { cid: consultantId })
      .andWhere('r.is_hidden = 0')
      .getRawOne();
    await this.consultantRepo.update(consultantId, {
      reviewCount: Number(result?.cnt ?? 0),
      avgRating: Math.round(Number(result?.avg ?? 0) * 100) / 100,
    });
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  C12: PAYOUT FLOW
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Release held earnings to 'available' after 48h â€” called by scheduler */
  async releaseConsultantEarningsHold() {
    const now = new Date();
    // BUG-C5: Join with booking to skip earnings for cancelled/refunded/disputed bookings
    const held = await this.earningRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.booking', 'b')
      .where('e.status = :s', { s: 'hold' })
      .andWhere('e.available_at <= :now', { now })
      .getMany();
    for (const e of held) {
      const booking = (e as any).booking;
      if (booking && ['cancelled', 'disputed', 'no_show'].includes(booking.status)) {
        e.status = 'refunded';
        await this.earningRepo.save(e);
        continue;
      }
      if (booking && ['refund_pending', 'refunded'].includes(booking.paymentStatus)) {
        e.status = 'refunded';
        await this.earningRepo.save(e);
        continue;
      }
      // BUG-H4: Only release if client confirmed OR 48h auto-confirm window passed
      if (booking && !booking.clientConfirmedAt) {
        // Client hasn't confirmed — check if 48h auto-confirm window has passed
        const completedAt = booking.completedAt ? new Date(booking.completedAt) : null;
        const autoConfirmDeadline = completedAt
          ? new Date(completedAt.getTime() + 48 * 60 * 60 * 1000)
          : null;
        if (!autoConfirmDeadline || now < autoConfirmDeadline) {
          // Still within the window — don't release yet, wait for client confirmation or auto-confirm
          continue;
        }
        // 48h passed without client action — auto-confirm
        booking.clientConfirmedAt = now;
        await this.bookingRepo.save(booking);
      }
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
  /** Consultant requests a payout of available balance */
  async requestPayout(userId: number, dto: RequestConsultantPayoutDto) {
    const consultant = await this.getApprovedConsultant(userId);

    // PAY3: Enforce minimum payout amount
    const MIN_PAYOUT_AMOUNT = 50;
    if (dto.amount < MIN_PAYOUT_AMOUNT) {
      throw new BadRequestException(`Minimum payout amount is ${MIN_PAYOUT_AMOUNT} EGP`);
    }

    // BUG-H3: Move balance check + earning marking inside a single transaction with row locking
    const result = await this.dataSource.transaction(async (manager) => {
      // Lock the available earnings rows to prevent concurrent payout race condition
      const availableEarnings = await manager
        .createQueryBuilder(this.earningRepo.target, 'e')
        .setLock('pessimistic_write')
        .where('e.consultant_id = :id', { id: consultant.id })
        .andWhere('e.status = :s', { s: 'available' })
        .orderBy('e.created_at', 'ASC')
        .getMany();

      const availableBalance = availableEarnings.reduce((s, e) => s + Number(e.amount), 0);

      if (dto.amount > availableBalance) {
        throw new BadRequestException(
          `Requested amount (${dto.amount}) exceeds available balance (${availableBalance.toFixed(2)})`,
        );
      }

      // Create payout request
      const request = await manager.save(
        manager.create(this.payoutRepo.target, {
          consultantId: consultant.id,
          amount: dto.amount,
          currency: consultant.currency ?? 'EGP',
          method: dto.method ?? consultant.payoutMethod ?? 'instapay',
          accountDetails: dto.accountDetails ?? consultant.payoutAccountDetails ?? null,
          status: 'pending',
        }),
      );

      // Mark corresponding earnings as 'paid' and link to payout request (PAY2)
      let remaining = dto.amount;
      for (const e of availableEarnings) {
        if (remaining <= 0) break;
        e.status = 'paid';
        (e as any).payoutRequestId = request.id;
        await manager.save(e);
        remaining -= Number(e.amount);
      }

      return request;
    });

    // Notify admins (non-blocking, outside transaction)
    const admins = await this.usersRepo.find({ where: { isAdmin: true } });
    for (const admin of admins) {
      await this.notificationsService.create(
        admin.id,
        'consultant_payout_request',
        'New consultant payout request',
        'Ø·Ù„Ø¨ Ø³Ø­Ø¨ Ø¬Ø¯ÙŠØ¯ Ù…Ù† Ù…Ø³ØªØ´Ø§Ø±',
        `${consultant.displayName} requested a payout of ${dto.amount} ${consultant.currency ?? 'EGP'}`,
        `${consultant.displayName} Ø·Ù„Ø¨ Ø³Ø­Ø¨ ${dto.amount} ${consultant.currency ?? 'EGP'}`,
        { consultantId: consultant.id, payoutRequestId: result.id },
      );
    }

    return result;
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

    // If failed, refund earnings back to 'available' — PAY2: use payoutRequestId for precision
    if (dto.status === 'failed') {
      const linkedEarnings = await this.earningRepo.find({
        where: { consultantId: request.consultantId, status: 'paid', payoutRequestId: request.id },
      });
      for (const e of linkedEarnings) {
        e.status = 'available';
        e.payoutRequestId = null;
        await this.earningRepo.save(e);
      }
    }

    await this.payoutRepo.save(request);

    // Email consultant about the outcome
    try {
      const feBase = this.getFrontendBaseUrl();
      const consultantUser = request.consultant?.user;
      if (consultantUser) {
        await this.mail.send(
          consultantUser.email,
          dto.status === 'completed'
            ? 'Your payout has been processed â€” Oikivo'
            : 'Payout processing update â€” Oikivo',
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
    } catch (e) { this.logger.warn(`Non-blocking payout notification error: ${e?.message}`); }

    return request;
  }

  // BUG-H2: Admin-only InstaPay payment verification (replaces consultant-side verification)
  async adminVerifyPayment(bookingId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['consultant', 'consultant.user'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (['cancelled', 'no_show'].includes(booking.status)) {
      throw new BadRequestException('Cannot verify payment on a cancelled or no-show booking');
    }
    if (booking.paymentMethod !== 'instapay') {
      throw new BadRequestException('This booking does not use InstaPay');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('Payment already verified');
    }
    if (!['submitted', 'pending'].includes(booking.paymentStatus)) {
      throw new BadRequestException('No payment proof submitted yet');
    }

    booking.paymentStatus = 'paid';
    const saved = await this.bookingRepo.save(booking);

    // Notify consultant
    try {
      const feBase = this.getFrontendBaseUrl();
      const consultant = booking.consultant;
      const consultantUser = consultant?.user;
      const client = await this.usersRepo.findOne({ where: { id: booking.clientId } });
      if (consultantUser) {
        const scheduledLabel = new Date(booking.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
        const sessionLabel = `${booking.durationMinutes} min Consultation`;
        await this.mail.send(
          consultantUser.email,
          'Payment verified for your consultation booking \u2013 Oikivo',
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
      // Notify consultant in-app
      if (consultant?.userId) {
        await this.notificationsService.create(
          consultant.userId,
          'payment_verified',
          'Payment verified by admin',
          '\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062F\u0641\u0639 \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0645\u0634\u0631\u0641',
          `Payment for booking #${booking.id} has been verified. You can now confirm the session.`,
          `\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062F\u0641\u0639 \u0627\u0644\u062D\u062C\u0632 #${booking.id}. \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062C\u0644\u0633\u0629.`,
          { consultationBookingId: booking.id },
        );
      }
    } catch (e) { this.logger.warn(`Non-blocking admin verify payment notification error: ${e?.message}`); }

    return saved;
  }

  // BUG-H2: Admin list pending payment verifications
  async adminListPendingPayments(params: { page?: number }) {
    const page = params.page ?? 1;
    const limit = 25;
    const qb = this.bookingRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.consultant', 'c')
      .leftJoinAndSelect('c.user', 'cu')
      .leftJoinAndSelect('b.client', 'cl')
      .where('b.payment_method = :pm', { pm: 'instapay' })
      .andWhere('b.payment_status = :ps', { ps: 'submitted' })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: ['cancelled', 'no_show'] })
      .orderBy('b.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  private async getApprovedConsultant(userId: number): Promise<ConsultantEntity> {
    const consultant = await this.consultantRepo.findOne({ where: { userId } });
    if (!consultant) throw new NotFoundException('Consultant profile not found');
    if (consultant.status !== 'approved') throw new ForbiddenException('Your consultant profile is not approved yet');
    return consultant;
  }

  /** FE-12: Single source of truth for FRONTEND_URL resolution */
  private getFrontendBaseUrl(): string {
    const raw = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return (raw.split(',')[0]?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
  }

  // BUG-M1: Mark a booking as no_show with party-specific refund logic
  async markNoShow(bookingId: number, dto: AdminMarkNoShowDto) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['consultant'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      throw new BadRequestException('Only confirmed or in-progress bookings can be marked as no-show');
    }

    const wasCompleted = booking.status === 'completed';
    booking.status = 'no_show';
    booking.cancelledBy = 'admin';
    booking.cancellationReason = `No-show by ${dto.noShowParty}`;

    if (dto.noShowParty === 'consultant') {
      // Consultant no-show → full refund to client
      if (['paid', 'hold'].includes(booking.paymentStatus)) {
        booking.refundAmount = Number(booking.price);
        booking.cancellationFee = 0;
        booking.paymentStatus = 'refund_pending';
      }
      // Cancel any existing earning
      const earning = await this.earningRepo.findOne({ where: { bookingId } });
      if (earning && earning.status !== 'refunded') {
        earning.status = 'refunded';
        await this.earningRepo.save(earning);
      }
    } else {
      // Client no-show → consultant keeps the money, no refund
      // Leave paymentStatus as-is (consultant deserves payment for showing up)
    }

    // BUG-M5: Decrement totalSessions if the booking was previously completed
    if (wasCompleted && booking.consultant) {
      await this.consultantRepo.decrement({ id: booking.consultantId }, 'totalSessions', 1);
    }

    const saved = await this.bookingRepo.save(booking);

    // Notify both parties
    const [client, consultantUser] = await Promise.all([
      this.usersRepo.findOne({ where: { id: booking.clientId } }),
      booking.consultant?.userId
        ? this.usersRepo.findOne({ where: { id: booking.consultant.userId } })
        : null,
    ]);
    if (client) {
      await this.notificationsService.create(
        client.id, 'booking_no_show', 'Session marked as no-show',
        '\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0639\u062F\u0645 \u062D\u0636\u0648\u0631',
        `Booking #${bookingId} was marked as no-show (${dto.noShowParty} did not attend).`,
        `\u0627\u0644\u062D\u062C\u0632 #${bookingId} \u062A\u0645 \u062A\u0633\u062C\u064A\u0644\u0647 \u0643\u0639\u062F\u0645 \u062D\u0636\u0648\u0631 (${dto.noShowParty}).`,
        { consultationBookingId: bookingId },
      );
    }
    if (consultantUser) {
      await this.notificationsService.create(
        consultantUser.id, 'booking_no_show', 'Session marked as no-show',
        '\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0639\u062F\u0645 \u062D\u0636\u0648\u0631',
        `Booking #${bookingId} was marked as no-show (${dto.noShowParty} did not attend).`,
        `\u0627\u0644\u062D\u062C\u0632 #${bookingId} \u062A\u0645 \u062A\u0633\u062C\u064A\u0644\u0647 \u0643\u0639\u062F\u0645 \u062D\u0636\u0648\u0631 (${dto.noShowParty}).`,
        { consultationBookingId: bookingId },
      );
    }

    return saved;
  }

  // BE-20: Mark a booking as disputed (admin only)
  async markDisputed(bookingId: number) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (['cancelled', 'disputed'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be disputed');
    }
    booking.status = 'disputed';
    return this.bookingRepo.save(booking);
  }

  // BUG-M2: Admin resolves a dispute with specific resolution
  async adminResolveDispute(bookingId: number, dto: AdminResolveDisputeDto) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['consultant'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'disputed') {
      throw new BadRequestException('Booking is not in disputed state');
    }

    const earning = await this.earningRepo.findOne({ where: { bookingId } });

    if (dto.resolution === 'refund_client') {
      // Full refund to client, cancel earning
      if (['paid', 'hold'].includes(booking.paymentStatus)) {
        booking.refundAmount = Number(booking.price);
        booking.cancellationFee = 0;
        booking.paymentStatus = 'refund_pending';
      }
      if (earning && earning.status !== 'refunded') {
        earning.status = 'refunded';
        await this.earningRepo.save(earning);
      }
      // BUG-M5: Decrement totalSessions since session is voided
      if (booking.consultant) {
        await this.consultantRepo.decrement({ id: booking.consultantId }, 'totalSessions', 1);
      }
    } else if (dto.resolution === 'pay_consultant') {
      // Consultant keeps money, release earning
      if (earning && earning.status === 'hold') {
        earning.status = 'available';
        await this.earningRepo.save(earning);
      }
    } else if (dto.resolution === 'split') {
      // 50/50 split — partial refund to client, partial to consultant
      const halfPrice = Math.round(Number(booking.price) * 0.5 * 100) / 100;
      booking.refundAmount = halfPrice;
      booking.cancellationFee = halfPrice;
      if (['paid', 'hold'].includes(booking.paymentStatus)) {
        booking.paymentStatus = 'refund_pending';
      }
      if (earning) {
        // Reduce earning amount to half
        earning.amount = Math.round(Number(booking.consultantPayout) * 0.5 * 100) / 100;
        earning.status = 'available';
        await this.earningRepo.save(earning);
      }
    }

    booking.status = 'cancelled'; // Dispute resolved — close the booking
    booking.cancellationReason = `Dispute resolved: ${dto.resolution}${dto.note ? ' — ' + dto.note : ''}`;
    booking.cancelledBy = 'admin';
    const saved = await this.bookingRepo.save(booking);

    // Notify both parties
    const [client, consultantUser] = await Promise.all([
      this.usersRepo.findOne({ where: { id: booking.clientId } }),
      booking.consultant?.userId
        ? this.usersRepo.findOne({ where: { id: booking.consultant.userId } })
        : null,
    ]);
    const resolutionLabel = {
      refund_client: 'Full refund issued to client',
      pay_consultant: 'Payment released to consultant',
      split: '50/50 split — partial refund to client',
    }[dto.resolution];

    for (const user of [client, consultantUser].filter(Boolean)) {
      await this.notificationsService.create(
        user!.id, 'dispute_resolved', 'Dispute has been resolved',
        '\u062A\u0645 \u062D\u0644 \u0627\u0644\u0646\u0632\u0627\u0639',
        `Booking #${bookingId} dispute resolved: ${resolutionLabel}.${dto.note ? ' Note: ' + dto.note : ''}`,
        `\u062A\u0645 \u062D\u0644 \u0646\u0632\u0627\u0639 \u0627\u0644\u062D\u062C\u0632 #${bookingId}: ${resolutionLabel}.`,
        { consultationBookingId: bookingId },
      );
    }

    return saved;
  }

  // REF1: Admin list bookings with pending refunds
  async adminListPendingRefunds(params: { page?: number }) {
    const page = params.page ?? 1;
    const limit = 25;
    const qb = this.bookingRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.consultant', 'c')
      .leftJoinAndSelect('c.user', 'cu')
      .leftJoinAndSelect('b.client', 'cl')
      .where('b.payment_status = :ps', { ps: 'refund_pending' })
      .orderBy('b.updated_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // REF2: Admin marks a refund as completed
  async adminProcessRefund(bookingId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['consultant'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.paymentStatus !== 'refund_pending') {
      throw new BadRequestException('Booking does not have a pending refund');
    }

    booking.paymentStatus = 'refunded';
    const saved = await this.bookingRepo.save(booking);

    // Ensure earning is cancelled
    const earning = await this.earningRepo.findOne({ where: { bookingId } });
    if (earning && earning.status !== 'refunded' && earning.status !== 'paid') {
      earning.status = 'refunded';
      await this.earningRepo.save(earning);
    }

    // Notify client that refund is processed
    const client = await this.usersRepo.findOne({ where: { id: booking.clientId } });
    if (client) {
      await this.notificationsService.create(
        client.id, 'refund_completed', 'Your refund has been processed',
        '\u062A\u0645 \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0633\u062A\u0631\u062F\u0627\u062F\u0643',
        `Refund of ${Number(booking.refundAmount).toFixed(2)} ${booking.currency} for booking #${bookingId} has been sent via InstaPay.`,
        `\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0633\u062A\u0631\u062F\u0627\u062F ${Number(booking.refundAmount).toFixed(2)} ${booking.currency} \u0644\u0644\u062D\u062C\u0632 #${bookingId} \u0639\u0628\u0631 InstaPay.`,
        { consultationBookingId: bookingId },
      );
    }

    return saved;
  }

  // MF-17: Bulk confirm/decline bookings (consultant only)
  async bulkRespondBookings(userId: number, bookingIds: number[], action: 'confirmed' | 'cancelled') {
    const consultant = await this.getApprovedConsultant(userId);
    const results: { id: number; success: boolean; error?: string }[] = [];
    for (const id of bookingIds) {
      try {
        const booking = await this.bookingRepo.findOne({ where: { id, consultantId: consultant.id } });
        if (!booking) { results.push({ id, success: false, error: 'Not found' }); continue; }
        if (booking.status !== 'pending') { results.push({ id, success: false, error: 'Not pending' }); continue; }

        if (action === 'confirmed') {
          if (booking.paymentMethod === 'instapay' && booking.paymentStatus !== 'paid') {
            results.push({ id, success: false, error: 'InstaPay booking cannot be confirmed before payment verification' });
            continue;
          }
          booking.status = 'confirmed';
        } else {
          booking.status = 'cancelled';
          booking.cancelledBy = 'consultant';
          if (['paid', 'submitted'].includes(booking.paymentStatus)) {
            booking.refundAmount = Number(booking.price);
            booking.cancellationFee = 0;
            booking.paymentStatus = 'refund_pending';
          }
        }
        await this.bookingRepo.save(booking);
        results.push({ id, success: true });
      } catch (e) {
        results.push({ id, success: false, error: e?.message ?? 'Unknown error' });
      }
    }
    return results;
  }

  // NEW-8: Explicit transition to in_progress at session start time
  async startSession(userId: number, bookingId: number) {
    const consultant = await this.getApprovedConsultant(userId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, consultantId: consultant.id },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed bookings can be started');
    }
    if (booking.paymentStatus !== 'paid') {
      throw new BadRequestException('Cannot start session before payment verification');
    }

    const now = new Date();
    const scheduledAt = new Date(booking.scheduledAt);
    const earlyWindow = new Date(scheduledAt.getTime() - 15 * 60 * 1000);
    if (now < earlyWindow) {
      throw new BadRequestException('You can start the session up to 15 minutes before scheduled time');
    }

    booking.status = 'in_progress';
    return this.bookingRepo.save(booking);
  }

  // MF-18: Export earnings as CSV data
  async exportEarningsCSV(userId: number) {
    const consultant = await this.getApprovedConsultant(userId);
    const earnings = await this.earningRepo.find({
      where: { consultantId: consultant.id },
      order: { createdAt: 'DESC' },
      relations: ['booking'],
    });
    const rows = earnings.map((e) => ({
      id: e.id,
      bookingId: e.bookingId,
      amount: Number(e.amount),
      platformFee: Number(e.platformFee),
      status: e.status,
      createdAt: e.createdAt?.toISOString(),
    }));
    return rows;
  }
}