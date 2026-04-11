import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { ConsultantEntity } from './consultant.entity';
import { UserEntity } from './user.entity';

@Entity('consultation_bookings')
export class ConsultationBookingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ unique: true, length: 36 })
  uuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = randomUUID();
  }

  @Column({ name: 'consultant_id', type: 'bigint', unsigned: true })
  consultantId: number;

  @ManyToOne(() => ConsultantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: ConsultantEntity;

  @Column({ name: 'client_id', type: 'bigint', unsigned: true })
  clientId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: UserEntity;

  @Column({ name: 'scheduled_at', type: 'datetime' })
  scheduledAt: Date;

  @Column({ name: 'duration_minutes', type: 'int', unsigned: true })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'platform_fee', type: 'decimal', precision: 10, scale: 2 })
  platformFee: number;

  @Column({ name: 'consultant_payout', type: 'decimal', precision: 10, scale: 2 })
  consultantPayout: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'disputed'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'payment_status', type: 'enum', enum: ['pending', 'submitted', 'paid', 'refunded', 'hold', 'refund_pending'], default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'payment_method', type: 'enum', enum: ['card', 'instapay', 'wallet'], default: 'instapay' })
  paymentMethod: string;

  @Column({ name: 'meeting_link', length: 500, nullable: true })
  meetingLink: string;

  @Column({ name: 'client_note', type: 'text', nullable: true })
  clientNote: string;

  @Column({ name: 'consultant_note', type: 'text', nullable: true })
  consultantNote: string;

  @Column({ name: 'payment_reference', length: 255, nullable: true })
  paymentReference: string | null;

  @Column({ name: 'payment_proof_url', length: 500, nullable: true })
  paymentProofUrl: string | null;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ name: 'cancellation_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  cancellationFee: number;

  @Column({ name: 'pre_session_reminder_sent', type: 'tinyint', default: 0 })
  preSessionReminderSent: boolean;

  @Column({
    name: 'delivery_mode',
    type: 'enum',
    enum: ['video_call', 'phone', 'in_person', 'chat'],
    default: 'video_call',
  })
  deliveryMode: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_by', type: 'enum', enum: ['client', 'consultant', 'admin'], nullable: true })
  cancelledBy: string;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date;

  /** When the client confirmed the session took place (BE-4 fix) */
  @Column({ name: 'client_confirmed_at', type: 'datetime', nullable: true })
  clientConfirmedAt: Date;

  /** P4: Deadline for client to submit payment (auto-cancel if missed) */
  @Column({ name: 'payment_deadline', type: 'datetime', nullable: true })
  paymentDeadline: Date | null;

  /** MISS5: Whether a payment reminder email has been sent */
  @Column({ name: 'payment_reminder_sent', type: 'tinyint', default: 0 })
  paymentReminderSent: boolean;

  /** MISS6: Original scheduledAt before reschedule (null if never rescheduled) */
  @Column({ name: 'original_scheduled_at', type: 'datetime', nullable: true })
  originalScheduledAt: Date | null;

  /** IANA timezone string provided by the client at booking time (D1) */
  @Column({ name: 'client_timezone', length: 50, default: 'Africa/Cairo', nullable: true })
  clientTimezone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
