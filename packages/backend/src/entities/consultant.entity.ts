import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, BeforeInsert, Unique,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { UserEntity } from './user.entity';

@Entity('consultants')
@Unique(['userId'])
export class ConsultantEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ unique: true, length: 36 })
  uuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = randomUUID();
  }

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'display_name', length: 120 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'json', nullable: true })
  specializations: string[];

  @Column({ name: 'years_experience', type: 'tinyint', unsigned: true, default: 0 })
  yearsExperience: number;

  @Column({ type: 'json', nullable: true })
  languages: string[];

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ name: 'review_count', type: 'int', unsigned: true, default: 0 })
  reviewCount: number;

  @Column({ name: 'total_sessions', type: 'int', unsigned: true, default: 0 })
  totalSessions: number;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' })
  status: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ name: 'is_featured', type: 'tinyint', default: 0 })
  isFeatured: boolean;

  /** Consultant's local timezone for scheduling purposes (D2) */
  @Column({ length: 50, default: 'UTC' })
  timezone: string;

  /** C12: Preferred payout method */
  @Column({ name: 'payout_method', type: 'enum', enum: ['instapay', 'bank_transfer'], nullable: true })
  payoutMethod: 'instapay' | 'bank_transfer' | null;

  /** C12: Payout account details (phone number for InstaPay, IBAN for bank) */
  @Column({ name: 'payout_account_details', length: 300, nullable: true })
  payoutAccountDetails: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('ConsultantDocumentEntity', 'consultant')
  documents: any[];

  @OneToMany('ConsultantAvailabilityEntity', 'consultant')
  availability: any[];
}
