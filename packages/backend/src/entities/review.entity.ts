import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PropertyEntity } from './property.entity';
import { BookingEntity } from './booking.entity';

@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
  bookingId: number;

  @ManyToOne(() => BookingEntity, (b) => b.review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ name: 'reviewer_id', type: 'bigint', unsigned: true })
  reviewerId: number;

  @ManyToOne(() => UserEntity, (u) => u.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: UserEntity;

  /** 'guest' = guest reviewing property; 'host' = host reviewing guest */
  @Column({ name: 'reviewer_role', type: 'enum', enum: ['guest', 'host'], default: 'guest' })
  reviewerRole: 'guest' | 'host';

  /** Populated for host→guest reviews — the guest being reviewed */
  @Column({ name: 'reviewed_user_id', type: 'bigint', unsigned: true, nullable: true })
  reviewedUserId: number | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_user_id' })
  reviewedUser: UserEntity | null;

  @Column({ name: 'property_id', type: 'bigint', unsigned: true })
  propertyId: number;

  @ManyToOne(() => PropertyEntity, (p) => p.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ name: 'overall_rating', type: 'tinyint', unsigned: true })
  overallRating: number;

  @Column({ name: 'cleanliness_rating', type: 'tinyint', unsigned: true, nullable: true })
  cleanlinessRating: number;

  @Column({ name: 'accuracy_rating', type: 'tinyint', unsigned: true, nullable: true })
  accuracyRating: number;

  @Column({ name: 'communication_rating', type: 'tinyint', unsigned: true, nullable: true })
  communicationRating: number;

  @Column({ name: 'location_rating', type: 'tinyint', unsigned: true, nullable: true })
  locationRating: number;

  @Column({ name: 'value_rating', type: 'tinyint', unsigned: true, nullable: true })
  valueRating: number;

  @Column({ name: 'checkin_rating', type: 'tinyint', unsigned: true, nullable: true })
  checkinRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  /** G4: Review photos — array of file URLs uploaded by the reviewer */
  @Column({ name: 'photos', type: 'json', nullable: true })
  photos: string[] | null;

  @Column({ name: 'host_reply', type: 'text', nullable: true })
  hostReply: string;

  @Column({ name: 'host_replied_at', type: 'datetime', nullable: true })
  hostRepliedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false, comment: 'Soft delete flag for reviews', select: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true, select: false })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'enum', enum: ['admin', 'guest', 'host'], nullable: true, select: false })
  deletedBy: string | null;

  @Column({ name: 'is_flagged', type: 'tinyint', default: 0 })
  isFlagged: boolean;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
