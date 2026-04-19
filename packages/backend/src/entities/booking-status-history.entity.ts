import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { BookingEntity } from './booking.entity';
import { UserEntity } from './user.entity';

@Entity('booking_status_history')
export class BookingStatusHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
  bookingId: number;

  @ManyToOne(() => BookingEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ name: 'from_status', type: 'varchar', length: 30, nullable: true })
  fromStatus: string | null;

  @Column({ name: 'to_status', type: 'varchar', length: 30 })
  toStatus: string;

  @Column({ name: 'changed_by_id', type: 'bigint', unsigned: true, nullable: true })
  changedById: number | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: UserEntity | null;

  @Column({
    name: 'changed_by_role',
    type: 'enum',
    enum: ['guest', 'host', 'admin', 'system'],
    default: 'system',
  })
  changedByRole: 'guest' | 'host' | 'admin' | 'system';

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
