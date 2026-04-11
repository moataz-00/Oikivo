import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ConsultantEntity } from './consultant.entity';
import { ConsultationBookingEntity } from './consultation-booking.entity';

@Entity('consultant_earnings')
export class ConsultantEarningEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'consultant_id', type: 'bigint', unsigned: true })
  consultantId: number;

  @ManyToOne(() => ConsultantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: ConsultantEntity;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
  bookingId: number;

  @ManyToOne(() => ConsultationBookingEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'booking_id' })
  booking: ConsultationBookingEntity;

  /** PAY2: Links earning to the payout request that claimed it (null if unclaimed) */
  @Column({ name: 'payout_request_id', type: 'bigint', unsigned: true, nullable: true })
  payoutRequestId: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'platform_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['hold', 'available', 'paid', 'refunded'],
    default: 'hold',
  })
  status: 'hold' | 'available' | 'paid' | 'refunded';

  /** Datetime when held funds become available for payout (48h after session) */
  @Column({ name: 'available_at', type: 'datetime', nullable: true })
  availableAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
