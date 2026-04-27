import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { UserEntity } from './user.entity';
import { BookingEntity } from './booking.entity';

export type DisputeCategory =
  | 'property_not_as_described'
  | 'no_show'
  | 'safety_concern'
  | 'refund_request'
  | 'damage_claim'
  | 'other';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';
export type DisputeResolution = 'resolved_for_guest' | 'resolved_for_host' | 'dismissed' | 'split';

@Entity('disputes')
export class DisputeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 36, unique: true, nullable: true })
  uuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = randomUUID();
  }

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
  bookingId: number;

  @ManyToOne(() => BookingEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ name: 'raised_by_id', type: 'bigint', unsigned: true })
  raisedById: number;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'raised_by_id' })
  raisedBy: UserEntity;

  @Column({
    type: 'enum',
    enum: ['property_not_as_described', 'no_show', 'safety_concern', 'refund_request', 'damage_claim', 'other'],
    default: 'other',
  })
  category: DisputeCategory;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['open', 'under_review', 'resolved', 'closed'],
    default: 'open',
  })
  status: DisputeStatus;

  @Column({
    type: 'enum',
    enum: ['resolved_for_guest', 'resolved_for_host', 'dismissed', 'split'],
    nullable: true,
  })
  resolution: DisputeResolution | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string | null;

  // FIX AD2: Dispute assignment & workflow
  @Column({ name: 'assigned_to_id', type: 'bigint', unsigned: true, nullable: true })
  assignedToId: number | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: UserEntity;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  priority: 'low' | 'medium' | 'high' | 'critical';

  @Column({ name: 'sla_deadline', type: 'datetime', nullable: true })
  slaDeadline: Date | null;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'additional_info', type: 'text', nullable: true })
  additionalInfo: string | null;

  // FIX DISP-G1: Evidence upload support
  @Column({ type: 'json', nullable: true })
  evidence: string[] | null; // Array of file paths: /uploads/disputes/{id}/evidence-*.jpg

  // FIX DISP-G2: Appeal process support
  @Column({ name: 'appeal_requested', type: 'boolean', default: false })
  appealRequested: boolean;

  @Column({ name: 'appeal_reason', type: 'text', nullable: true })
  appealReason: string | null;

  @Column({ name: 'appealed_at', type: 'datetime', nullable: true })
  appealedAt: Date | null;

  @Column({ name: 'appeal_reviewed_by_id', type: 'bigint', unsigned: true, nullable: true })
  appealReviewedById: number | null;

  @Column({ name: 'appeal_resolution', type: 'text', nullable: true })
  appealResolution: string | null;

  @Column({ name: 'appeal_resolved_at', type: 'datetime', nullable: true })
  appealResolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
