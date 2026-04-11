import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CoHostEntity } from '../entities/cohost.entity';
import { PropertyEntity } from '../entities/property.entity';
import { UserEntity } from '../entities/user.entity';
import { InviteCohostDto } from './dto/invite-cohost.dto';
import { RespondCohostDto } from './dto/respond-cohost.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplCohostInvite } from '../mail/mail.service';

@Injectable()
export class CohostsService {
  constructor(
    @InjectRepository(CoHostEntity)
    private cohostsRepo: Repository<CoHostEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    private notificationsService: NotificationsService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  private async getPropertyOrFail(propertyId: number): Promise<PropertyEntity> {
    const prop = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!prop) throw new NotFoundException('Property not found');
    return prop;
  }

  // ── B8: pagination added ──────────────────────────────────────────────────
  async getCohosts(propertyId: number, requesterId: number, page = 1, limit = 50) {
    const prop = await this.getPropertyOrFail(propertyId);
    const isMember =
      prop.hostId === requesterId ||
      !!(await this.cohostsRepo.findOne({ where: { propertyId, cohostId: requesterId } }));
    if (!isMember) throw new ForbiddenException('Not authorized to view cohosts for this property');

    const [items, total] = await this.cohostsRepo.findAndCount({
      where: { propertyId },
      relations: ['cohost'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  // ── B1 + B2: notification & email on invite ───────────────────────────────
  async inviteCohost(propertyId: number, hostId: number, dto: InviteCohostDto) {
    const prop = await this.getPropertyOrFail(propertyId);
    if (prop.hostId !== hostId) {
      throw new ForbiddenException('Only the property owner can invite cohosts');
    }

    const invitee = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!invitee) throw new NotFoundException('No user found with that email address');
    if (invitee.id === hostId) throw new ForbiddenException('You cannot invite yourself');
    if (!invitee.isHost) throw new BadRequestException('The invited user must be an active host on the platform');

    const existing = await this.cohostsRepo.findOne({
      where: { propertyId, cohostId: invitee.id },
    });
    if (existing) throw new ConflictException('This user is already a cohost or has a pending invite');

    const host = await this.usersRepo.findOne({ where: { id: hostId } });

    const cohost = await this.cohostsRepo.save(
      this.cohostsRepo.create({
        propertyId,
        hostId,
        cohostId: invitee.id,
        role: dto.role ?? 'co_host',
        status: 'pending',
      }),
    );

    const roleLabel = 'Co-host';

    // B1 — in-app notification
    await this.notificationsService.create(
      invitee.id,
      'cohost_invite',
      `Co-host invitation — ${prop.title}`,
      `دعوة مضيف مشارك — ${prop.title}`,
      `${host?.firstName ?? 'A host'} invited you as a ${roleLabel}`,
      `دعاك ${host?.firstName ?? 'مضيف'} كـ${roleLabel}`,
      { propertyId, cohostRecordId: cohost.id, role: dto.role ?? 'co_host' },
    );

    // B2 — email notification
    try {
      const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
      const invitesUrl = `${fe.replace(/\/+$/, '')}/en/account/invites`;
      await this.mailService.send(
        invitee.email,
        `You've been invited as a ${roleLabel} — Oikivo`,
        tplCohostInvite(
          invitee.firstName,
          `${host?.firstName ?? ''} ${host?.lastName ?? ''}`.trim(),
          prop.title,
          dto.role ?? 'co_host',
          invitesUrl,
        ),
      );
    } catch (_e) {
      // Non-fatal — invite is saved even if email fails
    }

    return this.cohostsRepo.findOne({ where: { id: cohost.id }, relations: ['cohost'] });
  }

  async respondToInvite(propertyId: number, cohostId: number, dto: RespondCohostDto) {
    const record = await this.cohostsRepo.findOne({
      where: { propertyId, cohostId, status: 'pending' },
    });
    if (!record) throw new NotFoundException('No pending cohost invite found');

    await this.cohostsRepo.update(record.id, { status: dto.response });
    return this.cohostsRepo.findOne({ where: { id: record.id }, relations: ['cohost'] });
  }

  async removeCohost(propertyId: number, hostId: number, cohostId: number) {
    const prop = await this.getPropertyOrFail(propertyId);
    if (prop.hostId !== hostId) {
      throw new ForbiddenException('Only the property owner can remove cohosts');
    }

    const record = await this.cohostsRepo.findOne({ where: { propertyId, cohostId } });
    if (!record) throw new NotFoundException('Cohost not found');

    await this.cohostsRepo.delete(record.id);
    return { message: 'Cohost removed successfully' };
  }

  // ── B4: re-invite after decline ───────────────────────────────────────────
  async reinviteCohost(propertyId: number, hostId: number, cohostId: number) {
    const prop = await this.getPropertyOrFail(propertyId);
    if (prop.hostId !== hostId) {
      throw new ForbiddenException('Only the property owner can re-invite cohosts');
    }

    const record = await this.cohostsRepo.findOne({ where: { propertyId, cohostId } });
    if (!record) throw new NotFoundException('Cohost record not found');
    if (record.status !== 'declined') {
      throw new BadRequestException('Can only re-invite a declined cohost');
    }

    await this.cohostsRepo.update(record.id, { status: 'pending' });

    const invitee = await this.usersRepo.findOne({ where: { id: cohostId } });
    const host = await this.usersRepo.findOne({ where: { id: hostId } });
    const roleLabel = record.role === 'cleaner' ? 'Cleaner' : 'Co-host';

    await this.notificationsService.create(
      cohostId,
      'cohost_invite',
      `Co-host re-invitation — ${prop.title}`,
      `دعوة مضيف مشارك — ${prop.title}`,
      `${host?.firstName ?? 'A host'} has re-invited you as a ${roleLabel}`,
      `أعاد ${host?.firstName ?? 'مضيف'} دعوتك كـ${roleLabel}`,
      { propertyId, cohostRecordId: record.id, role: record.role },
    );

    if (invitee) {
      try {
        const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
        await this.mailService.send(
          invitee.email,
          `Re-invitation as ${roleLabel} — Oikivo`,
          tplCohostInvite(
            invitee.firstName,
            `${host?.firstName ?? ''} ${host?.lastName ?? ''}`.trim(),
            prop.title,
            record.role as 'co_host' | 'cleaner',
            `${fe.replace(/\/+$/, '')}/en/account/invites`,
          ),
        );
      } catch (_e) { /* non-fatal */ }
    }

    return this.cohostsRepo.findOne({ where: { id: record.id }, relations: ['cohost'] });
  }

  // ── B5: properties where current user is accepted co-host ─────────────────
  async getMyProperties(userId: number, page = 1, limit = 100) {
    const [items, total] = await this.cohostsRepo.findAndCount({
      where: { cohostId: userId, status: 'accepted' },
      relations: ['property', 'property.photos', 'host'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  // ── B9: cohost relation added ─────────────────────────────────────────────
  async getMyInvites(userId: number, page = 1, limit = 100) {
    const [items, total] = await this.cohostsRepo.findAndCount({
      where: { cohostId: userId, status: 'pending' },
      relations: ['property', 'property.photos', 'host'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  // All co-hosts across all properties owned by the current host — single JOIN (no 2-step query)
  async getMyTeam(hostId: number) {
    return this.cohostsRepo
      .createQueryBuilder('co')
      .innerJoinAndSelect('co.property', 'prop', 'prop.hostId = :hostId', { hostId })
      .leftJoinAndSelect('co.cohost', 'cohost')
      .leftJoinAndSelect('prop.photos', 'photos')
      .orderBy('co.createdAt', 'DESC')
      .getMany();
  }
}

