import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EarningEntity } from '../entities/earning.entity';
import { PayoutEntity } from '../entities/payout.entity';
import { BookingEntity } from '../entities/booking.entity';
import { UserEntity } from '../entities/user.entity';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { MailService, tplPayoutNotification } from '../mail/mail.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(EarningEntity)
    private earningsRepo: Repository<EarningEntity>,
    @InjectRepository(PayoutEntity)
    private payoutsRepo: Repository<PayoutEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    private config: ConfigService,
    private mail: MailService,
    private auditLog: AuditLogService,
  ) {}

  // ─── AES-256-GCM field encryption ─────────────────────────────────────────
  private encryptField(text: string): string {
    const keyRaw = this.config.get<string>('PAYOUT_ENCRYPTION_KEY', '');
    if (!keyRaw || keyRaw.length < 32) return text;
    const key = Buffer.from(keyRaw.slice(0, 32), 'utf8');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decryptField(stored: string | null): string | null {
    if (!stored || !stored.startsWith('enc:')) return stored;
    try {
      const keyRaw = this.config.get<string>('PAYOUT_ENCRYPTION_KEY', '');
      if (!keyRaw || keyRaw.length < 32) return stored;
      const key = Buffer.from(keyRaw.slice(0, 32), 'utf8');
      const parts = stored.split(':');
      const iv = Buffer.from(parts[1], 'hex');
      const tag = Buffer.from(parts[2], 'hex');
      const encrypted = Buffer.from(parts[3], 'hex');
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
    } catch {
      return '[decryption failed]';
    }
  }

  // ─── Sync earnings from completed/paid bookings ────────────────────────────
  private async syncEarnings(hostId: number): Promise<void> {
    const completedBookings = await this.bookingsRepo.find({
      where: { hostId, status: 'completed', paymentStatus: 'paid' },
    });

    for (const booking of completedBookings) {
      const exists = await this.earningsRepo.findOne({ where: { bookingId: booking.id } });
      if (!exists) {
        const platformFee = Number(booking.serviceFee);
        const amount = Number(booking.totalAmount) - platformFee;
        const availableAt = new Date(booking.checkOut);
        availableAt.setDate(availableAt.getDate() + 1); // available day after checkout

        await this.earningsRepo.save(
          this.earningsRepo.create({
            hostId,
            bookingId: booking.id,
            amount,
            platformFee,
            currency: 'EGP',
            status: new Date() >= availableAt ? 'available' : 'pending',
            availableAt,
          }),
        );
      }
    }
  }

  async getEarningsSummary(hostId: number) {
    await this.syncEarnings(hostId);

    const earnings = await this.earningsRepo.find({
      where: { hostId },
      relations: ['booking', 'booking.property'],
      order: { createdAt: 'DESC' },
    });

    const total = earnings.reduce((s, e) => s + Number(e.amount), 0);
    const available = earnings
      .filter((e) => e.status === 'available')
      .reduce((s, e) => s + Number(e.amount), 0);
    const pending = earnings
      .filter((e) => e.status === 'pending')
      .reduce((s, e) => s + Number(e.amount), 0);
    const paid = earnings
      .filter((e) => e.status === 'paid')
      .reduce((s, e) => s + Number(e.amount), 0);

    // Monthly breakdown (last 6 months)
    const monthlySummary: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlySummary[key] = 0;
    }
    for (const e of earnings) {
      const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlySummary) {
        monthlySummary[key] += Number(e.amount);
      }
    }

    return {
      summary: { total, available, pending, paid, currency: 'EGP' },
      monthly: Object.entries(monthlySummary).map(([month, amount]) => ({ month, amount })),
      earnings,
    };
  }

  async requestPayout(hostId: number, dto: RequestPayoutDto) {
    await this.syncEarnings(hostId);

    const available = await this.earningsRepo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.host_id = :hostId AND e.status = :status', { hostId, status: 'available' })
      .getRawOne();

    const availableBalance = Number(available?.total ?? 0);
    if (dto.amount > availableBalance) {
      throw new BadRequestException(
        `Insufficient available balance. Available: EGP ${availableBalance.toFixed(2)}`,
      );
    }

    const payout = await this.payoutsRepo.save(
      this.payoutsRepo.create({
        hostId,
        amount: dto.amount,
        currency: 'EGP',
        method: dto.method,
        accountDetails: this.encryptField(dto.accountDetails),
        note: dto.note ?? null,
        status: 'pending',
      }),
    );

    // Mark consumed earnings as paid (FIFO)
    let remaining = dto.amount;
    const availableEarnings = await this.earningsRepo.find({
      where: { hostId, status: 'available' },
      order: { createdAt: 'ASC' },
    });
    for (const earning of availableEarnings) {
      if (remaining <= 0) break;
      await this.earningsRepo.update(earning.id, { status: 'paid' });
      remaining -= Number(earning.amount);
    }

    void this.auditLog.log({
      eventType: 'payout.requested',
      actorId: hostId,
      entityType: 'payout',
      entityId: payout.id,
      metadata: { amount: dto.amount, method: dto.method },
    });

    // Send payout request confirmation email (fire-and-forget)
    void (async () => {
      try {
        const host = await this.usersRepo.findOne({ where: { id: hostId } });
        if (host) {
          const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
          const earningsUrl = `${fe.replace(/\/+$/, '')}/en/hosting/earnings`;
          await this.mail.send(
            host.email,
            'Payout request received — Journey Stay',
            tplPayoutNotification(
              host.firstName,
              dto.amount.toFixed(2),
              'EGP',
              '—',
              '—',
              '—',
              new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
              `#${payout.id}`,
              earningsUrl,
            ),
          );
        }
      } catch { /* non-critical */ }
    })();

    return payout;
  }

  async getPayoutHistory(hostId: number) {
    const payouts = await this.payoutsRepo.find({
      where: { hostId },
      order: { createdAt: 'DESC' },
    });
    return payouts.map((p) => ({
      ...p,
      accountDetails: this.decryptField(p.accountDetails),
    }));
  }
}
