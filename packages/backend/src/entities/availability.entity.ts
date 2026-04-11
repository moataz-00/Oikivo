import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PropertyEntity } from './property.entity';
import { ICalSourceEntity } from './ical-source.entity';

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

  /** Which iCal feed blocked this date — null for host/booking sources */
  @Column({ name: 'ical_source_id', type: 'bigint', unsigned: true, nullable: true })
  icalSourceId: number | null;

  @ManyToOne(() => ICalSourceEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ical_source_id' })
  icalSource: ICalSourceEntity | null;
}
