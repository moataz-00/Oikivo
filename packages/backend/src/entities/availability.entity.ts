import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PropertyEntity } from './property.entity';

export type AvailabilitySource = 'host' | 'ical' | 'booking';

@Entity('property_availability')
@Unique(['propertyId', 'date'])
export class AvailabilityEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'property_id', type: 'bigint', unsigned: true })
  propertyId: number;

  @ManyToOne(() => PropertyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'price_override', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceOverride: number;

  /** Who blocked this date: 'host' (manual), 'ical' (external sync), 'booking' (active reservation) */
  @Column({
    type: 'enum',
    enum: ['host', 'ical', 'booking'],
    default: 'host',
  })
  source: AvailabilitySource;
}
