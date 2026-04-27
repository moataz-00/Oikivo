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
import { CoHostEntity } from '../entities/cohost.entity';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    @InjectRepository(CoHostEntity)
    private cohostRepo: Repository<CoHostEntity>,
    private notificationsService: NotificationsService,
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

    const saved = await this.disputesRepo.save(dispute);

    // WF-05: Notify accepted co-hosts of the property about the new dispute
    try {
      const cohosts = await this.cohostRepo.find({
        where: { propertyId: booking.property.id, role: 'co_host' as any, status: 'accepted' as any },
      });
      await Promise.allSettled(
        cohosts.map((ch) =>
          this.notificationsService.create(
            ch.cohostId,
            'dispute_opened',
            'A dispute was opened on your listing',
            'تم فتح نزاع على قائمتك',
            `A dispute has been opened for booking #${booking.id} on "${booking.property.title}".`,
            `تم فتح نزاع للحجز رقم #${booking.id} على "${booking.property.title}".`,
            { bookingId: booking.id, disputeId: saved.id },
          ),
        ),
      );
    } catch (e) {
      this.logger.warn(`[WF-05] Could not notify co-hosts: ${(e as Error).message}`);
    }

    return saved;
  }

  async getMyDisputes(userId: number): Promise<DisputeEntity[]> {
    return this.disputesRepo.find({
      where: { raisedById: userId },
      relations: ['booking', 'booking.property'],
      order: { createdAt: 'DESC' },
    });
  }

  async getHostDisputes(hostId: number): Promise<DisputeEntity[]> {
    return this.disputesRepo
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.booking', 'b')
      .leftJoinAndSelect('b.property', 'p')
      .leftJoinAndSelect('d.raisedBy', 'u')
      .where('b.hostId = :hostId', { hostId })
      .orderBy('d.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number, userId: number): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({
      where: { id },
      relations: ['booking', 'booking.property', 'booking.property.photos', 'raisedBy'],
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

  async findByUuid(uuid: string, userId: number): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({
      where: { uuid },
      relations: ['booking', 'booking.property', 'booking.property.photos', 'raisedBy'],
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

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

  async getAllDisputes(
    status?: string,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ items: DisputeEntity[]; total: number; totalPages: number; page: number }> {
    const qb = this.disputesRepo
      .createQueryBuilder('dispute')
      .leftJoinAndSelect('dispute.booking', 'booking')
      .leftJoinAndSelect('booking.property', 'property')
      .leftJoinAndSelect('dispute.raisedBy', 'raisedBy')
      .leftJoinAndSelect('dispute.assignedTo', 'assignedTo')
      .orderBy('dispute.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('dispute.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(LOWER(dispute.title) LIKE LOWER(:s) OR LOWER(dispute.description) LIKE LOWER(:s))',
        { s: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, totalPages: Math.ceil(total / limit), page };
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
      } else if (resolution === 'split') {
        // FIX O2: Split — refund 50% to guest, release 50% of earnings to host
        const booking = await manager.getRepository(BookingEntity).findOne({
          where: { id: dispute.bookingId },
        });
        if (booking && booking.paymentStatus === 'paid') {
          const splitRefund = parseFloat((Number(booking.totalAmount) / 2).toFixed(2));
          await manager.update(BookingEntity, dispute.bookingId, {
            refundAmount: splitRefund,
            paymentStatus: 'partially_refunded' as any,
          });
        }
        // Release earnings at 50% value to host
        const earning = await manager.getRepository(EarningEntity).findOne({
          where: { bookingId: dispute.bookingId },
        });
        if (earning) {
          const halfAmount = parseFloat((Number(earning.amount) / 2).toFixed(2));
          await manager.update(EarningEntity, earning.id, {
            amount: halfAmount,
            status: 'available',
          });
        }
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

  // FIX AD2: Assign dispute to admin
  async assignDispute(id: number, assignedToId: number | null): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    await this.disputesRepo.update(id, { assignedToId });
    return this.disputesRepo.findOne({ where: { id }, relations: ['assignedTo'] });
  }

  // FIX AD2: Set dispute priority
  async setDisputePriority(id: number, priority: 'low' | 'medium' | 'high' | 'critical'): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    await this.disputesRepo.update(id, { priority });
    return this.disputesRepo.findOne({ where: { id } });
  }

  // FIX AD2: Set SLA deadline
  async setDisputeSla(id: number, slaDeadline: string | null): Promise<DisputeEntity> {
    const dispute = await this.disputesRepo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    await this.disputesRepo.update(id, { slaDeadline: slaDeadline ? new Date(slaDeadline) : null });
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
