import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisputeEntity } from '../entities/dispute.entity';
import { BookingEntity } from '../entities/booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { BookingsService } from '../bookings/bookings.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    @InjectRepository(DisputeEntity)
    private disputesRepo: Repository<DisputeEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(EarningEntity)
    private earningsRepo: Repository<EarningEntity>,
    private bookingsService: BookingsService,
  ) {}

  async create(userId: number, dto: CreateDisputeDto): Promise<DisputeEntity> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['property'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Only guest or host of the booking can raise a dispute
    if (booking.guestId !== userId && booking.hostId !== userId) {
      throw new ForbiddenException('You are not a party to this booking');
    }

    // Disputes allowed on: completed, cancelled, or confirmed bookings where check-in has passed (mid-stay)
    if (!['completed', 'cancelled'].includes(booking.status)) {
      const isMidStay =
        booking.status === 'confirmed' && new Date(booking.checkIn) <= new Date();
      if (!isMidStay) {
        throw new BadRequestException(
          'Disputes can only be raised for completed, cancelled, or active (checked-in) bookings',
        );
      }
    }

    // One dispute per booking per user
    const existing = await this.disputesRepo.findOne({
      where: { bookingId: dto.bookingId, raisedById: userId },
    });
    if (existing) {
      throw new ConflictException('You have already raised a dispute for this booking');
    }

    const dispute = this.disputesRepo.create({
      bookingId: dto.bookingId,
      raisedById: userId,
      category: dto.category as any,
      title: dto.title,
      description: dto.description,
      status: 'open',
    });

    return this.disputesRepo.save(dispute);
  }

  async getMyDisputes(userId: number): Promise<DisputeEntity[]> {
    return this.disputesRepo.find({
      where: { raisedById: userId },
      relations: ['booking', 'booking.property'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({
      where: { id },
      relations: ['booking', 'booking.property', 'raisedBy'],
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    // Only the raiser, the other party, or an admin can view
    const booking = dispute.booking as BookingEntity;
    if (
      dispute.raisedById !== userId &&
      booking.guestId !== userId &&
      booking.hostId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this dispute');
    }

    return dispute;
  }

  // ─── Admin methods ─────────────────────────────────────────────────────────

  async getAllDisputes(status?: string): Promise<DisputeEntity[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.disputesRepo.find({
      where,
      relations: ['booking', 'booking.property', 'raisedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async resolveDispute(
    id: number,
    resolution: 'resolved_for_guest' | 'resolved_for_host' | 'dismissed' | 'split',
    adminNote: string,
  ): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new BadRequestException('Dispute is already resolved');
    }

    // 4.4 — Trigger financial action before persisting resolution
    if (resolution === 'resolved_for_guest') {
      // Refund the guest: reuse existing refundBooking logic (admin action — no userId check)
      try {
        await this.bookingsService.refundBooking(dispute.bookingId);
      } catch (err) {
        // Log but do not block the dispute resolution if refund call fails
        this.logger.error(
          `[Dispute #${id}] refundBooking failed for booking #${dispute.bookingId}: ${(err as Error).message}`,
        );
      }
    } else if (resolution === 'resolved_for_host') {
      // Unlock any held (pending) earnings for this booking
      try {
        await this.earningsRepo.update(
          { bookingId: dispute.bookingId, status: 'pending' },
          { status: 'available' },
        );
      } catch (err) {
        this.logger.error(
          `[Dispute #${id}] Failed to release earnings for booking #${dispute.bookingId}: ${(err as Error).message}`,
        );
      }
    }

    await this.disputesRepo.update(id, {
      resolution,
      adminNote,
      status: 'resolved',
      resolvedAt: new Date(),
    });

    return this.disputesRepo.findOne({ where: { id } });
  }

  async updateStatus(id: number, status: 'open' | 'under_review' | 'resolved' | 'closed'): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    await this.disputesRepo.update(id, { status });
    return this.disputesRepo.findOne({ where: { id } });
  }

  // G14: Append additional information or evidence to an open dispute
  async appendUpdate(id: number, userId: number, message: string): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({
      where: { id },
      relations: ['booking'],
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const booking = dispute.booking as BookingEntity;
    if (
      dispute.raisedById !== userId &&
      booking?.guestId !== userId &&
      booking?.hostId !== userId
    ) {
      throw new ForbiddenException('Not authorized to update this dispute');
    }

    if (['resolved', 'closed'].includes(dispute.status)) {
      throw new BadRequestException('Cannot add updates to a resolved or closed dispute');
    }

    const timestamp = new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
    const entry = `\n[${timestamp}] ${message.trim()}`;
    const updated = (dispute.additionalInfo ?? '') + entry;

    await this.disputesRepo.update(id, { additionalInfo: updated });
    return this.disputesRepo.findOne({ where: { id } });
  }
}
