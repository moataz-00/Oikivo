import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

/**
 * Immutable audit log for sensitive operations.
 *
 * Logged events: booking creation/confirmation/cancellation,
 * payment submission/confirmation/refund, payout request/approval,
 * admin decisions, and dispute operations.
 */
@Entity('audit_logs')
@Index(['actorId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['eventType', 'createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** Event identifier, e.g. 'booking.created', 'payment.refunded' */
  @Column({ name: 'event_type', length: 100 })
  eventType: string;

  /** The user who performed the action (null for system events) */
  @Column({ name: 'actor_id', type: 'bigint', unsigned: true, nullable: true })
  actorId: number | null;

  /** e.g. 'booking', 'payment', 'payout', 'user' */
  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  /** ID of the affected entity */
  @Column({ name: 'entity_id', type: 'bigint', unsigned: true, nullable: true })
  entityId: number | null;

  /** JSON blob with relevant context (old/new values, amounts, reasons, etc.) */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  /** IP address of the actor at the time of the action */
  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
