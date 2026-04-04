import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { ConsultationBookingEntity } from './consultation-booking.entity';
import { ConsultantEntity } from './consultant.entity';
import { UserEntity } from './user.entity';

@Entity('consultation_reviews')
@Unique(['bookingId'])
export class ConsultationReviewEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
  bookingId: number;

  @ManyToOne(() => ConsultationBookingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: ConsultationBookingEntity;

  @Column({ name: 'reviewer_id', type: 'bigint', unsigned: true })
  reviewerId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: UserEntity;

  @Column({ name: 'consultant_id', type: 'bigint', unsigned: true })
  consultantId: number;

  @ManyToOne(() => ConsultantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: ConsultantEntity;

  @Column({ name: 'overall_rating', type: 'tinyint', unsigned: true })
  overallRating: number;

  @Column({ name: 'expertise_rating', type: 'tinyint', unsigned: true, nullable: true })
  expertiseRating: number;

  @Column({ name: 'communication_rating', type: 'tinyint', unsigned: true, nullable: true })
  communicationRating: number;

  @Column({ name: 'value_rating', type: 'tinyint', unsigned: true, nullable: true })
  valueRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'consultant_reply', type: 'text', nullable: true })
  consultantReply: string;

  @Column({ name: 'consultant_replied_at', type: 'datetime', nullable: true })
  consultantRepliedAt: Date;

  /** Set by admins to hide inappropriate reviews from public view (D4) */
  @Column({ name: 'is_hidden', type: 'tinyint', unsigned: true, default: 0 })
  isHidden: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
