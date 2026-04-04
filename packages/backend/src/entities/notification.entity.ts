import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => UserEntity, (u) => u.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ length: 60 })
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'title_ar', length: 255, nullable: true })
  titleAr: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'body_ar', type: 'text', nullable: true })
  bodyAr: string;

  @Column({ name: 'data_json', type: 'json', nullable: true })
  dataJson: Record<string, any>;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
