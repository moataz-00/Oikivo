import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  /**
   * Record an audit event.  Non-throwing — failures are swallowed so they
   * cannot break the primary business operation.
   */
  async log(opts: {
    eventType: string;
    actorId?: number | null;
    entityType: string;
    entityId?: number | null;
    metadata?: Record<string, unknown> | null;
    ipAddress?: string | null;
  }): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          eventType: opts.eventType,
          actorId: opts.actorId ?? null,
          entityType: opts.entityType,
          entityId: opts.entityId ?? null,
          metadata: opts.metadata ?? null,
          ipAddress: opts.ipAddress ?? null,
        }),
      );
    } catch {
      /* swallow — audit must never cause a 500 in the primary path */
    }
  }

  async findAll(opts?: {
    entityType?: string;
    actorId?: number;
    limit?: number;
    offset?: number;
  }) {
    const qb = this.repo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');

    if (opts?.entityType) qb.andWhere('log.entityType = :et', { et: opts.entityType });
    if (opts?.actorId) qb.andWhere('log.actorId = :aid', { aid: opts.actorId });
    qb.take(opts?.limit ?? 100).skip(opts?.offset ?? 0);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
