import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ExperienceEntity } from './experience.entity';

@Entity('experience_photos')
export class ExperiencePhotoEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'experience_id', type: 'bigint', unsigned: true })
  experienceId: number;

  @ManyToOne(() => ExperienceEntity, (e) => e.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experience_id' })
  experience: ExperienceEntity;

  @Column({ length: 500 })
  url: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_cover', type: 'tinyint', width: 1, default: 0 })
  isCover: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
