import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ExperienceBookingEntity } from './experience-booking.entity';
import { ExperienceEntity } from './experience.entity';
import { UserEntity } from './user.entity';

@Entity('experience_reviews')
export class ExperienceReviewEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true, unique: true })
  bookingId: number;

  @OneToOne(() => ExperienceBookingEntity, (b) => b.review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: ExperienceBookingEntity;

  @Column({ name: 'reviewer_id', type: 'bigint', unsigned: true })
  reviewerId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: UserEntity;

  @Column({ name: 'experience_id', type: 'bigint', unsigned: true })
  experienceId: number;

  @ManyToOne(() => ExperienceEntity, (e) => e.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experience_id' })
  experience: ExperienceEntity;

  @Column({ name: 'overall_rating', type: 'tinyint', unsigned: true })
  overallRating: number;

  @Column({ name: 'host_rating', type: 'tinyint', unsigned: true, nullable: true })
  hostRating: number | null;

  @Column({ name: 'value_rating', type: 'tinyint', unsigned: true, nullable: true })
  valueRating: number | null;

  @Column({ name: 'activity_rating', type: 'tinyint', unsigned: true, nullable: true })
  activityRating: number | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'host_reply', type: 'text', nullable: true })
  hostReply: string | null;

  @Column({ name: 'host_replied_at', type: 'datetime', nullable: true })
  hostRepliedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
