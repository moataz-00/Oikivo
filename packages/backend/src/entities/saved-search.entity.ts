import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('saved_searches')
@Index(['userId'])
export class SavedSearchEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ length: 100 })
  name: string;

  /**
   * G5: Persisted search filter params (location, dates, guests, priceMin, priceMax, etc.)
   * Stored as JSON so callers can replay the search by forwarding to the search endpoint.
   */
  @Column({ type: 'json' })
  filters: Record<string, unknown>;

  @Column({ name: 'alert_enabled', default: false })
  alertEnabled: boolean;

  @Column({ name: 'last_alerted_at', type: 'datetime', nullable: true })
  lastAlertedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
