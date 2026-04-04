import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { ConsultantEntity } from './consultant.entity';

@Entity('consultant_availability')
@Unique(['consultantId', 'dayOfWeek', 'startTime'])
export class ConsultantAvailabilityEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'consultant_id', type: 'bigint', unsigned: true })
  consultantId: number;

  @ManyToOne(() => ConsultantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: ConsultantEntity;

  @Column({ name: 'day_of_week', type: 'tinyint', unsigned: true })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: boolean;
}
