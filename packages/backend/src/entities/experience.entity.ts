import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { UserEntity } from './user.entity';
import { ExperienceCategoryEntity } from './experience-category.entity';
import { ExperiencePhotoEntity } from './experience-photo.entity';
import { ExperienceItineraryEntity } from './experience-itinerary.entity';
import { ExperienceBookingEntity } from './experience-booking.entity';
import { ExperienceReviewEntity } from './experience-review.entity';
import { ExperienceScheduleEntity } from './experience-schedule.entity';

@Entity('experiences')
export class ExperienceEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ unique: true, length: 36, nullable: true })
  uuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = randomUUID();
  }

  @Column({ name: 'host_id', type: 'bigint', unsigned: true })
  hostId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column({ name: 'category_id', type: 'int', unsigned: true, nullable: true })
  categoryId: number | null;

  @ManyToOne(() => ExperienceCategoryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: ExperienceCategoryEntity | null;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'what_well_do', type: 'text', nullable: true })
  whatWellDo: string | null;

  @Column({ name: 'what_i_will_provide', type: 'text', nullable: true })
  whatIWillProvide: string | null;

  @Column({ name: 'guest_requirements', type: 'text', nullable: true })
  guestRequirements: string | null;

  @Column({ length: 50, default: 'English' })
  language: string;

  @Column({ name: 'duration_minutes', type: 'int', default: 120 })
  durationMinutes: number;

  @Column({ name: 'max_guests', type: 'int', default: 10 })
  maxGuests: number;

  @Column({ name: 'min_guests', type: 'int', default: 1 })
  minGuests: number;

  @Column({ name: 'price_per_person', type: 'decimal', precision: 10, scale: 2 })
  pricePerPerson: number;

  @Column({ name: 'group_discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  groupDiscountPercent: number;

  @Column({ length: 150 })
  city: string;

  @Column({ length: 500, nullable: true })
  address: string | null;

  @Column({ length: 150, default: 'Egypt' })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ name: 'meeting_point', type: 'text', nullable: true })
  meetingPoint: string | null;

  @Column({ name: 'instant_book', type: 'tinyint', width: 1, default: 0 })
  instantBook: boolean;

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: string;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount: number;

  @Column({ name: 'total_bookings', type: 'int', default: 0 })
  totalBookings: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'timestamp', nullable: true, default: null })
  archivedAt: Date | null;

  // Relations
  @OneToMany(() => ExperiencePhotoEntity, (p) => p.experience, { cascade: true })
  photos: ExperiencePhotoEntity[];

  @OneToMany(() => ExperienceItineraryEntity, (i) => i.experience, { cascade: true })
  itinerary: ExperienceItineraryEntity[];

  @OneToMany(() => ExperienceBookingEntity, (b) => b.experience)
  bookings: ExperienceBookingEntity[];

  @OneToMany(() => ExperienceReviewEntity, (r) => r.experience)
  reviews: ExperienceReviewEntity[];

  @OneToMany(() => ExperienceScheduleEntity, (s) => s.experience, { cascade: true })
  schedule: ExperienceScheduleEntity[];
}
