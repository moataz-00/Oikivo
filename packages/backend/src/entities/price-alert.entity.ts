import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('price_alerts')
@Index(['userId'])
@Index(['propertyId'])
export class PriceAlertEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'property_id' })
  propertyId: number;

  /** The price the user wants to be alerted at or below */
  @Column({ name: 'target_price', type: 'decimal', precision: 10, scale: 2 })
  targetPrice: number;

  /** Last known price when the alert was created or last checked */
  @Column({ name: 'last_known_price', type: 'decimal', precision: 10, scale: 2 })
  lastKnownPrice: number;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'notified_at', type: 'datetime', nullable: true })
  notifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
