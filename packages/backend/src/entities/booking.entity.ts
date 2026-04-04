import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToOne, JoinColumn, BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from './user.entity';
import { PropertyEntity } from './property.entity';
import { ReviewEntity } from './review.entity';

@Entity('bookings')
export class BookingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'booking_uuid', length: 36, unique: true, nullable: true })
  bookingUuid: string;

  /**
   * G9: Human-readable short code for check-in display and QR generation.
   * Format: STAY-XXXX (uppercase base-36 of the booking ID, zero-padded to 4 chars).
   * Computed on first read; stored for indexability.
   */
  @Column({ name: 'short_code', length: 12, nullable: true })
  shortCode: string | null;

  @BeforeInsert()
  generateUuid() {
    if (!this.bookingUuid) this.bookingUuid = uuidv4();
  }

  @Column({ name: 'property_id', type: 'bigint', unsigned: true })
  propertyId: number;

  @ManyToOne(() => PropertyEntity, (p) => p.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ name: 'guest_id', type: 'bigint', unsigned: true })
  guestId: number;

  @ManyToOne(() => UserEntity, (u) => u.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guest_id' })
  guest: UserEntity;

  @Column({ name: 'host_id', type: 'bigint', unsigned: true })
  hostId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column({ name: 'check_in', type: 'date' })
  checkIn: string;

  @Column({ name: 'check_out', type: 'date' })
  checkOut: string;

  @Column({ name: 'guests_count', default: 1 })
  guestsCount: number;

  @Column({ default: 1 })
  nights: number;

  @Column({ name: 'base_amount', type: 'decimal', precision: 10, scale: 2 })
  baseAmount: number;

  @Column({ name: 'cleaning_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  cleaningFee: number;

  @Column({ name: 'service_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxes: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  depositAmount: number;

  @Column({
    name: 'deposit_status',
    type: 'enum',
    enum: ['none', 'held', 'claimed', 'released'],
    default: 'none',
  })
  depositStatus: 'none' | 'held' | 'claimed' | 'released';

  @Column({ name: 'deposit_claim_deadline', type: 'datetime', nullable: true })
  depositClaimDeadline: Date | null;

  @Column({ name: 'deposit_released_at', type: 'datetime', nullable: true })
  depositReleasedAt: Date | null;

  @Column({ name: 'deposit_claim_reason', type: 'text', nullable: true })
  depositClaimReason: string | null;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'declined'],
    default: 'pending',
  })
  status: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ['pending', 'submitted', 'paid', 'refunded', 'declined'],
    default: 'pending',
  })
  paymentStatus: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: ['instapay', 'cash', 'card', 'stripe', 'opay-card'],
    nullable: true,
  })
  paymentMethod: string | null;

  @Column({ name: 'payment_reference', type: 'varchar', length: 100, nullable: true })
  paymentReference: string | null;

  @Column({ name: 'payment_note', type: 'text', nullable: true })
  paymentNote: string | null;

  @Column({ name: 'payment_proof_url', type: 'varchar', length: 500, nullable: true })
  paymentProofUrl: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: 'opay_order_reference', type: 'varchar', length: 100, nullable: true })
  opayOrderReference: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({
    name: 'cancellation_policy',
    type: 'enum',
    enum: ['flexible', 'moderate', 'strict'],
    nullable: true,
  })
  cancellationPolicy: string | null;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ name: 'cancellation_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  cancellationFee: number;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_by', type: 'enum', enum: ['guest', 'host', 'admin', 'system'], nullable: true })
  cancelledBy: string | null;

  @Column({ name: 'guest_note', type: 'text', nullable: true })
  guestNote: string;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  specialRequests: string;

  @Column({ name: 'refund_reason', type: 'varchar', length: 500, nullable: true })
  refundReason: string | null;

  /**
   * JSON array of modification snapshots.
   * Each entry: { changedAt, changedBy, changes: { field, from, to }[] }
   */
  @Column({ name: 'modification_history', type: 'json', nullable: true })
  modificationHistory: Array<{
    changedAt: string;
    changedBy: string;
    changes: Array<{ field: string; from: unknown; to: unknown }>;
  }> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => ReviewEntity, (r) => r.booking)
  review: ReviewEntity;
}
