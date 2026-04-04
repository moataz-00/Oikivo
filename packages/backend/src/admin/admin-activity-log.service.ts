import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminActivityLogEntity } from '../entities/admin-activity-log.entity';

@Injectable()
export class AdminActivityLogService {
  constructor(
    @InjectRepository(AdminActivityLogEntity)
    private readonly repo: Repository<AdminActivityLogEntity>,
  ) {}

  log(
    adminId: number | null,
    action: string,
    entityType?: string,
    entityId?: string | number,
    details?: Record<string, any>,
    ipAddress?: string,
  ): Promise<AdminActivityLogEntity> {
    const entry = this.repo.create({
      adminId,
      action,
      entityType: entityType ?? null,
      entityId: entityId != null ? String(entityId) : null,
      details: details ?? null,
      ipAddress: ipAddress ?? null,
    });
    return this.repo.save(entry);
  }

  async getAll(page = 1, limit = 50, adminId?: number) {
    const qb = this.repo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (adminId) {
      qb.where('log.adminId = :adminId', { adminId });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
        admin: l.admin
          ? { id: l.admin.id, firstName: l.admin.firstName, lastName: l.admin.lastName, email: l.admin.email }
          : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
