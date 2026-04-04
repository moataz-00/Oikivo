import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ConsultantEntity } from './consultant.entity';

@Entity('consultant_payout_requests')
export class ConsultantPayoutRequestEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'consultant_id', type: 'bigint', unsigned: true })
  consultantId: number;

  @ManyToOne(() => ConsultantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: ConsultantEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ type: 'enum', enum: ['instapay', 'bank_transfer'], default: 'instapay' })
  method: 'instapay' | 'bank_transfer';

  /** Encrypted account details (phone / IBAN) */
  @Column({ name: 'account_details', length: 500, nullable: true })
  accountDetails: string | null;

  @Column({ type: 'enum', enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'processed_at', type: 'datetime', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
