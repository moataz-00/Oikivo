import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { PayoutEntity } from './payout.entity';
import { EarningEntity } from './earning.entity';
import { BookingEntity } from './booking.entity';

@Entity('payout_items')
export class PayoutItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'payout_id', type: 'bigint', unsigned: true })
  payoutId: number;

  @ManyToOne(() => PayoutEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payout_id' })
  payout: PayoutEntity;

  @Column({ name: 'earning_id', type: 'bigint', unsigned: true, nullable: true })
  earningId: number | null;

  @ManyToOne(() => EarningEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'earning_id' })
  earning: EarningEntity | null;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true, nullable: true })
  bookingId: number | null;

  @ManyToOne(() => BookingEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
