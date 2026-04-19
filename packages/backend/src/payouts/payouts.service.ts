import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EarningEntity } from '../entities/earning.entity';
import { PayoutEntity } from '../entities/payout.entity';
import { BookingEntity } from '../entities/booking.entity';
import { UserEntity } from '../entities/user.entity';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { UpdateAutoPayoutSettingsDto } from './dto/update-auto-payout-settings.dto';
import { MailService, tplPayoutNotification } from '../mail/mail.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class PayoutsService {
  private getEncryptionKey(): Buffer | null {
    const keyRaw = this.config.get<string>('PAYOUT_ENCRYPTION_KEY')
      || this.config.get<string>('ENCRYPTION_KEY')
      || '';
    if (!keyRaw || keyRaw.length < 32) return null;
    return Buffer.from(keyRaw.slice(0, 32), 'utf8');
  }

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
    private dataSource: DataSource,
  ) {}

  // ─── AES-256-GCM field encryption ─────────────────────────────────────────
  private encryptField(text: string): string {
    const key = this.getEncryptionKey();
    if (!key) return text;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decryptField(stored: string | null): string | null {
    if (!stored || !stored.startsWith('enc:')) return stored;
    try {
      const key = this.getEncryptionKey();
      if (!key) return stored;
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

    const enrichedEarnings = earnings.map((e) => {
      const booking: any = e.booking;
      const baseAmount = Number(booking?.baseAmount ?? 0);
      const cleaningFee = Number(booking?.cleaningFee ?? 0);
      const taxes = Number(booking?.taxes ?? 0);
      const gross = baseAmount + cleaningFee + taxes;
      const platformFee = Number(e.platformFee ?? 0);
      const net = Number(e.amount ?? 0);
      return {
        ...e,
        breakdown: {
          baseAmount,
          cleaningFee,
          taxes,
          platformFee,
          gross,
          net,
        },
      };
    });

    return {
      summary: { total, available, pending, paid, currency: 'EGP' },
      monthly: Object.entries(monthlySummary).map(([month, amount]) => ({ month, amount })),
      earnings: enrichedEarnings,
    };
  }

  async requestPayout(hostId: number, dto: RequestPayoutDto) {
    await this.syncEarnings(hostId);

    // FIX PO3: Use a transaction with pessimistic locking to prevent duplicate/concurrent payouts
    return this.dataSource.transaction(async (manager) => {
      // Check for any pending payouts — prevent duplicate requests
      const pendingCount = await manager.getRepository(PayoutEntity).count({
        where: { hostId, status: 'pending' } as any,
      });
      if (pendingCount > 0) {
        throw new BadRequestException(
          'You already have a pending payout request. Please wait for it to be processed.',
        );
      }

      // Lock available earnings rows for this host to prevent concurrent reads
      const lockedEarnings = await manager
        .getRepository(EarningEntity)
        .createQueryBuilder('e')
        .setLock('pessimistic_write')
        .where('e.host_id = :hostId AND e.status = :status', { hostId, status: 'available' })
        .orderBy('e.createdAt', 'ASC')
        .getMany();

      const availableBalance = lockedEarnings.reduce((s, e) => s + Number(e.amount), 0);
      if (dto.amount > availableBalance) {
        throw new BadRequestException(
          `Insufficient available balance. Available: EGP ${availableBalance.toFixed(2)}`,
        );
      }

      const payout = await manager.getRepository(PayoutEntity).save(
        manager.getRepository(PayoutEntity).create({
          hostId,
          amount: dto.amount,
          currency: 'EGP',
          method: dto.method,
          accountDetails: this.encryptField(dto.accountDetails),
          note: dto.note ?? null,
          status: 'pending',
          isAuto: false,
        }),
      );

      // FIX PO2: Mark earnings as 'reserved' (not 'paid') — they stay recoverable if payout is rejected
      let remaining = dto.amount;
      for (const earning of lockedEarnings) {
        if (remaining <= 0) break;
        await manager.getRepository(EarningEntity).update(earning.id, {
          status: 'reserved',
          payoutId: payout.id,
        } as any);
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
            'Payout request received — Oikivo',
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
    }); // end transaction
  }

  async getAutoPayoutSettings(hostId: number) {
    const host = await this.usersRepo.findOne({ where: { id: hostId } });
    if (!host) throw new NotFoundException('Host not found');

    return {
      enabled: !!(host as any).autoPayoutEnabled,
      frequency: (host as any).autoPayoutFrequency ?? 'weekly',
      day: (host as any).autoPayoutDay ?? null,
      minBalance: Number((host as any).autoPayoutMinBalance ?? 100),
      method: (host as any).autoPayoutMethod ?? 'instapay',
      accountDetails: this.decryptField((host as any).autoPayoutAccountDetails ?? null),
    };
  }

  async updateAutoPayoutSettings(hostId: number, dto: UpdateAutoPayoutSettingsDto) {
    const host = await this.usersRepo.findOne({ where: { id: hostId } });
    if (!host) throw new NotFoundException('Host not found');

    const nextFrequency = dto.frequency ?? (host as any).autoPayoutFrequency ?? 'weekly';
    if (dto.day != null) {
      if (nextFrequency === 'weekly' && (dto.day < 0 || dto.day > 6)) {
        throw new BadRequestException('For weekly frequency, day must be between 0 (Sun) and 6 (Sat).');
      }
      if (nextFrequency === 'monthly' && (dto.day < 1 || dto.day > 28)) {
        throw new BadRequestException('For monthly frequency, day must be between 1 and 28.');
      }
    }

    await this.usersRepo.update(hostId, {
      ...(dto.enabled != null ? { autoPayoutEnabled: dto.enabled } : {}),
      ...(dto.frequency ? { autoPayoutFrequency: dto.frequency } : {}),
      ...(dto.day != null ? { autoPayoutDay: dto.day } : {}),
      ...(dto.minBalance != null ? { autoPayoutMinBalance: dto.minBalance } : {}),
      ...(dto.method ? { autoPayoutMethod: dto.method } : {}),
      ...(dto.accountDetails != null ? { autoPayoutAccountDetails: this.encryptField(dto.accountDetails) } : {}),
    } as any);

    return this.getAutoPayoutSettings(hostId);
  }

  async runScheduledAutoPayouts(): Promise<{ processed: number; skipped: number }> {
    const hosts = await this.usersRepo.find({
      where: { isHost: true, autoPayoutEnabled: true } as any,
    });
    const now = new Date();
    let processed = 0;
    let skipped = 0;

    for (const host of hosts as any[]) {
      const frequency = host.autoPayoutFrequency ?? 'weekly';
      const day = host.autoPayoutDay;
      const dueToday = frequency === 'weekly'
        ? (day == null || now.getDay() === Number(day))
        : (day == null ? now.getDate() === 1 : now.getDate() === Number(day));
      if (!dueToday) {
        skipped += 1;
        continue;
      }

      const pending = await this.payoutsRepo.count({
        where: { hostId: host.id, status: 'pending' } as any,
      });
      if (pending > 0) {
        skipped += 1;
        continue;
      }

      const available = await this.earningsRepo
        .createQueryBuilder('e')
        .select('COALESCE(SUM(e.amount), 0)', 'total')
        .where('e.host_id = :hostId AND e.status = :status', { hostId: host.id, status: 'available' })
        .getRawOne();

      const availableBalance = Number(available?.total ?? 0);
      const minBalance = Number(host.autoPayoutMinBalance ?? 100);
      const accountDetails = this.decryptField(host.autoPayoutAccountDetails ?? null);
      if (availableBalance < minBalance || !accountDetails) {
        skipped += 1;
        continue;
      }

      const payout = await this.requestPayout(host.id, {
        amount: availableBalance,
        method: host.autoPayoutMethod ?? 'instapay',
        accountDetails,
        note: 'Auto payout',
      } as RequestPayoutDto);

      await this.payoutsRepo.update(payout.id, { isAuto: true } as any);
      processed += 1;
    }

    return { processed, skipped };
  }

  async getAnnualTaxSummary(hostId: number, year: number) {
    if (!Number.isFinite(year) || year < 2020 || year > 2100) {
      throw new BadRequestException('Invalid year');
    }

    await this.syncEarnings(hostId);
    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));

    const rows: Array<{
      month: string;
      grossAmount: string | number;
      platformFees: string | number;
      guestTaxesCollected: string | number;
      netPayoutEligible: string | number;
    }> = await this.earningsRepo.query(
      `
        SELECT DATE_FORMAT(b.check_out, '%Y-%m') AS month,
               ROUND(SUM(b.base_amount + b.cleaning_fee + b.taxes), 2) AS grossAmount,
               ROUND(SUM(e.platform_fee), 2) AS platformFees,
               ROUND(SUM(b.taxes), 2) AS guestTaxesCollected,
               ROUND(SUM(e.amount), 2) AS netPayoutEligible
        FROM earnings e
        INNER JOIN bookings b ON b.id = e.booking_id
        WHERE e.host_id = ? AND b.check_out >= ? AND b.check_out < ?
        GROUP BY DATE_FORMAT(b.check_out, '%Y-%m')
        ORDER BY month ASC
      `,
      [hostId, start, end],
    );

    const totals = rows.reduce(
      (acc, row) => {
        acc.grossAmount += Number(row.grossAmount ?? 0);
        acc.platformFees += Number(row.platformFees ?? 0);
        acc.guestTaxesCollected += Number(row.guestTaxesCollected ?? 0);
        acc.platformWithholdingTax += 0;
        acc.netPayoutEligible += Number(row.netPayoutEligible ?? 0);
        return acc;
      },
      {
        grossAmount: 0,
        platformFees: 0,
        guestTaxesCollected: 0,
        platformWithholdingTax: 0,
        netPayoutEligible: 0,
      },
    );

    return {
      year,
      currency: 'EGP',
      declaration: {
        platformWithholdingTaxApplied: false,
        platformWithholdingTaxRate: 0,
        note: 'Oikivo does not withhold tax from host payouts. Hosts are responsible for their own tax filing.',
      },
      totals,
      monthly: rows.map((row) => ({
        month: row.month,
        grossAmount: Number(row.grossAmount ?? 0),
        platformFees: Number(row.platformFees ?? 0),
        guestTaxesCollected: Number(row.guestTaxesCollected ?? 0),
        platformWithholdingTax: 0,
        netPayoutEligible: Number(row.netPayoutEligible ?? 0),
      })),
    };
  }

  async getPayoutInvoices(hostId: number, year?: number) {
    const where: any = { hostId };
    const payouts = await this.payoutsRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    const filtered = year
      ? payouts.filter((p) => new Date(p.createdAt).getUTCFullYear() === year)
      : payouts;

    return filtered.map((p) => ({
      payoutId: p.id,
      invoiceNumber: `OIK-PAYOUT-${p.id}`,
      issueDate: p.createdAt,
      status: p.status,
      method: p.method,
      currency: p.currency,
      grossPayoutAmount: Number(p.amount),
      platformWithholdingTax: 0,
      netTransferredAmount: Number(p.amount),
      note: 'No platform tax withholding applied by Oikivo.',
    }));
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
