import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { ConsultantEntity } from './consultant.entity';

@Entity('consultation_services')
export class ConsultationServiceEntity {
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

  @Column({ length: 200 })
  title: string;

  @Column({ name: 'title_ar', length: 200, nullable: true })
  titleAr: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string;

  @Column({
    type: 'enum',
    enum: [
      'listing_optimization', 'pricing_strategy', 'interior_design',
      'guest_experience', 'photography', 'superhost_coaching',
      'property_management', 'legal_compliance', 'marketing',
      'revenue_management', 'general',
    ],
    default: 'general',
  })
  category: string;

  @Column({ name: 'duration_minutes', type: 'int', unsigned: true, default: 60 })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ name: 'delivery_mode', type: 'enum', enum: ['video_call', 'in_person', 'phone', 'chat'], default: 'video_call' })
  deliveryMode: string;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: boolean;

  @Column({ name: 'max_bookings_per_day', type: 'tinyint', unsigned: true, default: 5 })
  maxBookingsPerDay: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
