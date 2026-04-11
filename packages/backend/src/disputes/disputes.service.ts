import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DisputeEntity } from '../entities/dispute.entity';
import { BookingEntity } from '../entities/booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { BookingsService } from '../bookings/bookings.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { unlinkSync } from 'fs';
import { join } from 'path';

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
    @InjectDataSource()
    private dataSource: DataSource,
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

    // Wrap resolution + financial action in transaction to ensure atomicity
    await this.dataSource.transaction(async (manager) => {
      // 4.4 — Trigger financial action before persisting resolution
      if (resolution === 'resolved_for_guest') {
        // Refund the guest: reuse existing refundBooking logic (admin action — no userId check)
        await this.bookingsService.refundBooking(dispute.bookingId);
      } else if (resolution === 'resolved_for_host') {
        // Unlock any held (pending) earnings for this booking
        await manager.update(
          EarningEntity,
          { bookingId: dispute.bookingId, status: 'pending' },
          { status: 'available' },
        );
      }

      // Only mark as resolved if financial action succeeded
      await manager.update(DisputeEntity, id, {
        resolution,
        adminNote,
        status: 'resolved',
        resolvedAt: new Date(),
      });
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

  // ─── FIX DISP-G1: Evidence upload support ──────────────────────────────────

  /**
   * Add evidence file to an open dispute.
   * Files are stored in /uploads/disputes/{disputeId}/
   */
  async addEvidence(
    id: number,
    userId: number,
    filePath: string,
  ): Promise<DisputeEntity> {
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
      throw new ForbiddenException('Not authorized to add evidence to this dispute');
    }

    if (['resolved', 'closed'].includes(dispute.status)) {
      throw new BadRequestException('Cannot add evidence to a resolved or closed dispute');
    }

    // Add file path to evidence array
    const currentEvidence = dispute.evidence || [];
    const updatedEvidence = [...currentEvidence, filePath];

    await this.disputesRepo.update(id, { evidence: updatedEvidence });
    return this.disputesRepo.findOne({ where: { id } });
  }

  /**
   * Remove evidence file from dispute.
   */
  async removeEvidence(
    id: number,
    userId: number,
    filePath: string,
  ): Promise<DisputeEntity> {
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
      throw new ForbiddenException('Not authorized to remove evidence from this dispute');
    }

    if (['resolved', 'closed'].includes(dispute.status)) {
      throw new BadRequestException('Cannot remove evidence from a resolved or closed dispute');
    }

    // Remove file from evidence array
    const currentEvidence = dispute.evidence || [];
    const updatedEvidence = currentEvidence.filter((path) => path !== filePath);

    // Delete file from disk
    try {
      const fullPath = join(process.cwd(), filePath);
      unlinkSync(fullPath);
    } catch (err) {
      this.logger.warn(`Failed to delete evidence file: ${filePath}`);
    }

    await this.disputesRepo.update(id, { evidence: updatedEvidence });
    return this.disputesRepo.findOne({ where: { id } });
  }

  // ─── FIX DISP-G2: Appeal process support ───────────────────────────────────

  /**
   * Request an appeal for a resolved dispute.
   * Only the party who raised the dispute can appeal.
   */
  async requestAppeal(
    id: number,
    userId: number,
    reason: string,
  ): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    // Only the raiser can appeal
    if (dispute.raisedById !== userId) {
      throw new ForbiddenException('Only the party who raised the dispute can request an appeal');
    }

    if (dispute.status !== 'resolved') {
      throw new BadRequestException('Only resolved disputes can be appealed');
    }

    if (dispute.appealRequested) {
      throw new ConflictException('Appeal already requested for this dispute');
    }

    await this.disputesRepo.update(id, {
      appealRequested: true,
      appealReason: reason,
      appealedAt: new Date(),
    });

    return this.disputesRepo.findOne({ where: { id } });
  }

  /**
   * Get all disputes with pending appeals (admin only).
   */
  async getDisputesWithPendingAppeals(): Promise<DisputeEntity[]> {
    return this.disputesRepo.find({
      where: {
        appealRequested: true,
        appealResolvedAt: null as any, // TypeORM workaround for IS NULL
      },
      relations: ['booking', 'booking.property', 'raisedBy'],
      order: { appealedAt: 'ASC' },
    });
  }

  /**
   * Review and resolve an appeal (senior admin only).
   */
  async resolveAppeal(
    id: number,
    reviewerId: number,
    resolution: string,
  ): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (!dispute.appealRequested) {
      throw new BadRequestException('No appeal requested for this dispute');
    }

    if (dispute.appealResolvedAt) {
      throw new BadRequestException('Appeal already reviewed');
    }

    await this.disputesRepo.update(id, {
      appealReviewedById: reviewerId,
      appealResolution: resolution,
      appealResolvedAt: new Date(),
    });

    return this.disputesRepo.findOne({ where: { id } });
  }
}
