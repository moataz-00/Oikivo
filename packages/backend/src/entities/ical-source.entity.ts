import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PropertyEntity } from './property.entity';

export type ICalSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

@Entity('property_ical_sources')
export class ICalSourceEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'property_id', type: 'bigint', unsigned: true })
  propertyId: number;

  @ManyToOne(() => PropertyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  /** Human-readable label, e.g. "Airbnb" or "Booking.com" */
  @Column({ length: 100 })
  label: string;

  /** The iCal feed URL provided by the external platform */
  @Column({ type: 'text' })
  url: string;

  @Column({
    name: 'sync_status',
    type: 'enum',
    enum: ['idle', 'syncing', 'success', 'error'],
    default: 'idle',
  })
  syncStatus: ICalSyncStatus;

  @Column({ name: 'last_synced_at', type: 'datetime', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
