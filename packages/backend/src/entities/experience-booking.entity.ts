import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExperienceEntity } from './experience.entity';
import { UserEntity } from './user.entity';
import { ExperienceReviewEntity } from './experience-review.entity';

@Entity('experience_bookings')
export class ExperienceBookingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'experience_id', type: 'bigint', unsigned: true })
  experienceId: number;

  @ManyToOne(() => ExperienceEntity, (e) => e.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experience_id' })
  experience: ExperienceEntity;

  @Column({ name: 'guest_id', type: 'bigint', unsigned: true })
  guestId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guest_id' })
  guest: UserEntity;

  @Column({ name: 'host_id', type: 'bigint', unsigned: true })
  hostId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column({ name: 'booking_date', type: 'date' })
  bookingDate: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'guests_count', type: 'int', default: 1 })
  guestsCount: number;

  @Column({ name: 'price_per_person', type: 'decimal', precision: 10, scale: 2 })
  pricePerPerson: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'service_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'declined'],
    default: 'pending',
  })
  status: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ['pending', 'submitted', 'paid', 'refunded'],
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

  @Column({ name: 'payment_reference', length: 255, nullable: true })
  paymentReference: string | null;

  @Column({ name: 'payment_proof_url', type: 'varchar', length: 500, nullable: true })
  paymentProofUrl: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: 'opay_order_reference', type: 'varchar', length: 100, nullable: true })
  opayOrderReference: string | null;

  @Column({ name: 'guest_note', type: 'text', nullable: true })
  guestNote: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @OneToOne(() => ExperienceReviewEntity, (r) => r.booking)
  review: ExperienceReviewEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
