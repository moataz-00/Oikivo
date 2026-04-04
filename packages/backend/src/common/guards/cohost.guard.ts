import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyEntity } from '../../entities/property.entity';
import { CoHostEntity } from '../../entities/cohost.entity';

/**
 * CoHostGuard — grants access when the authenticated user is either:
 *   - the property owner (hostId), or
 *   - an accepted co-host for the property.
 *
 * Reads propertyId from route params (`:propertyId` or `:id`).
 * Must be used after JwtAuthGuard so `request.user` is already populated.
 *
 * When decorated with @RequireCoHostRole('cleaner'|'co_host'), non-owner
 * co-hosts are further checked against their assigned role. (B3)
 */
@Injectable()
export class CoHostGuard implements CanActivate {
  constructor(
    @InjectRepository(PropertyEntity)
    private readonly propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(CoHostEntity)
    private readonly cohostsRepo: Repository<CoHostEntity>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Admins have unrestricted access
    if (user.isAdmin) return true;

    // Extract propertyId from :propertyId, :id, or request body
    const propertyId =
      parseInt(request.params?.propertyId) ||
      parseInt(request.params?.id) ||
      parseInt(request.body?.propertyId);

    if (!propertyId || isNaN(propertyId)) {
      throw new ForbiddenException('Property ID is required');
    }

    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    // Property owner — unrestricted
    if (property.hostId === user.id) return true;

    // Accepted co-host
    const cohost = await this.cohostsRepo.findOne({
      where: { propertyId, cohostId: user.id, status: 'accepted' },
    });

    if (!cohost) {
      throw new ForbiddenException('You do not have access to this property');
    }

    // B3 — optional role check from @RequireCoHostRole() decorator
    const requiredRole = this.reflector.get<string>('cohost_role', context.getHandler());
    if (requiredRole && cohost.role !== requiredRole) {
      throw new ForbiddenException(`This action requires the '${requiredRole}' role`);
    }

    return true;
  }
}

