import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
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

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
  bookingId: number;

  @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ name: 'raised_by_id', type: 'bigint', unsigned: true })
  raisedById: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
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

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'additional_info', type: 'text', nullable: true })
  additionalInfo: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
