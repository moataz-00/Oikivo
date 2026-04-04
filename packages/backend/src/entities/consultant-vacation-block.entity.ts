import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ConsultantEntity } from './consultant.entity';

@Entity({ name: 'consultant_vacation_blocks' })
export class ConsultantVacationBlockEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'consultant_id' })
  consultantId: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ConsultantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: ConsultantEntity;
}
