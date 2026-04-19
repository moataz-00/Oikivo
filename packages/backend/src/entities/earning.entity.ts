import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { BookingEntity } from './booking.entity';

@Entity('earnings')
export class EarningEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'host_id', type: 'bigint', unsigned: true })
  hostId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
  bookingId: number;

  @ManyToOne(() => BookingEntity, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'platform_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ type: 'enum', enum: ['pending', 'available', 'paid'], default: 'pending' })
  status: 'pending' | 'available' | 'paid';

  @Column({ name: 'available_at', type: 'datetime', nullable: true })
  availableAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
