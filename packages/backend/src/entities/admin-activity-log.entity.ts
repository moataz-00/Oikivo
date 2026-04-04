import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('admin_activity_logs')
@Index(['createdAt'])
export class AdminActivityLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'admin_id', type: 'bigint', unsigned: true, nullable: true })
  adminId: number | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'admin_id' })
  admin: UserEntity;

  @Column({ length: 120 })
  action: string;

  @Column({ name: 'entity_type', length: 60, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', length: 60, nullable: true })
  entityId: string | null;

  @Column({ type: 'json', nullable: true })
  details: Record<string, any> | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
