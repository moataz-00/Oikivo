import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PropertyEntity } from './property.entity';
import { BookingEntity } from './booking.entity';

@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true, unique: true })
  bookingId: number;

  @OneToOne(() => BookingEntity, (b) => b.review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ name: 'reviewer_id', type: 'bigint', unsigned: true })
  reviewerId: number;

  @ManyToOne(() => UserEntity, (u) => u.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: UserEntity;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
