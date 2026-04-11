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

@Entity('blocked_users')
@Index(['blockerId', 'blockedUserId'], { unique: true })
export class BlockedUserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'blocker_id', type: 'bigint', unsigned: true })
  blockerId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: UserEntity;

  @Column({ name: 'blocked_user_id', type: 'bigint', unsigned: true })
  blockedUserId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_user_id' })
  blockedUser: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
