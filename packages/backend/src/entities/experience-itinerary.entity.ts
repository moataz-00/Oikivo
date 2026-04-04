import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExperienceEntity } from './experience.entity';

@Entity('experience_itinerary')
export class ExperienceItineraryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'experience_id', type: 'bigint', unsigned: true })
  experienceId: number;

  @ManyToOne(() => ExperienceEntity, (e) => e.itinerary, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experience_id' })
  experience: ExperienceEntity;

  @Column({ name: 'step_number', type: 'int', default: 1 })
  stepNumber: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number | null;
}
