import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('platform_settings')
export class PlatformSettingEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  value: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
