import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('payouts')
export class PayoutEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'host_id', type: 'bigint', unsigned: true })
  hostId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ type: 'enum', enum: ['instapay', 'bank_transfer', 'cash'], default: 'instapay' })
  method: 'instapay' | 'bank_transfer' | 'cash';

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
