import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { BookingEntity } from './booking.entity';

export type TransactionType = 'charge' | 'refund' | 'partial_refund';
export type PaymentGateway = 'stripe' | 'opay' | 'instapay' | 'cash' | 'bank_transfer';
export type TransactionStatus = 'pending' | 'success' | 'failed';

@Entity('payment_transactions')
export class PaymentTransactionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true })
  bookingId: number;

  @ManyToOne(() => BookingEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({
    type: 'enum',
    enum: ['charge', 'refund', 'partial_refund'],
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['stripe', 'opay', 'instapay', 'cash', 'bank_transfer'],
  })
  gateway: PaymentGateway;

  @Column({ name: 'gateway_reference', type: 'varchar', length: 255, nullable: true })
  gatewayReference: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  })
  status: TransactionStatus;

  @Column({ name: 'failure_reason', type: 'varchar', length: 500, nullable: true })
  failureReason: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
