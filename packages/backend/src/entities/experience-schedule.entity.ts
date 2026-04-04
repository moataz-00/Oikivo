import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExperienceEntity } from './experience.entity';

@Entity('experience_schedule')
export class ExperienceScheduleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'experience_id', type: 'bigint', unsigned: true })
  experienceId: number;

  @ManyToOne(() => ExperienceEntity, (e) => e.schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experience_id' })
  experience: ExperienceEntity;

  @Column({ name: 'day_of_week', type: 'tinyint', unsigned: true })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive: boolean;
}
