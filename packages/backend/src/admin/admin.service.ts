import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { PropertyEntity } from '../entities/property.entity';
import { BookingEntity } from '../entities/booking.entity';
import { ReviewEntity } from '../entities/review.entity';
import { PayoutEntity } from '../entities/payout.entity';
import { EarningEntity } from '../entities/earning.entity';
import { ExperienceBookingEntity } from '../entities/experience-booking.entity';
import { PlatformSettingEntity } from '../entities/platform-setting.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplPayoutProcessed } from '../mail/mail.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(ReviewEntity)
    private reviewsRepo: Repository<ReviewEntity>,
    @InjectRepository(PayoutEntity)
    private payoutsRepo: Repository<PayoutEntity>,
    @InjectRepository(EarningEntity)
    private earningsRepo: Repository<EarningEntity>,
    @InjectRepository(ExperienceBookingEntity)
    private expBookingsRepo: Repository<ExperienceBookingEntity>,
    @InjectRepository(PlatformSettingEntity)
    private settingsRepo: Repository<PlatformSettingEntity>,
    @InjectRepository(NotificationEntity)
    private notificationsRepo: Repository<NotificationEntity>,
    private dataSource: DataSource,
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
    private mail: MailService,
  ) {}

  // ─── Users ─────────────────────────────────────────────────────────────────
  async getUsers(page = 1, limit = 20, search?: string, role?: string) {
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where(
        'u.email LIKE :s OR u.firstName LIKE :s OR u.lastName LIKE :s OR u.phone LIKE :s',
        { s: `%${search}%` },
      );
    }

    if (role === 'host') qb.andWhere('u.isHost = true');
    else if (role === 'admin') qb.andWhere('u.isAdmin = true');
    else if (role === 'guest') qb.andWhere('u.isHost = false AND u.isAdmin = false');

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserActive(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    await this.usersRepo.save(user);
    return { message: user.isActive ? 'User activated' : 'User suspended', isActive: user.isActive };
  }

  async toggleUserAdmin(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isAdmin = !user.isAdmin;
    await this.usersRepo.save(user);
    return { message: user.isAdmin ? 'Admin role granted' : 'Admin role revoked', isAdmin: user.isAdmin };
  }

  async reviewIdDocument(userId: number, approved: boolean) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.idDocumentUrl) throw new BadRequestException('No ID document submitted by this user');
    (user as any).isIdVerified = approved;
    (user as any).idVerificationStatus = approved ? 'approved' : 'rejected';
    await this.usersRepo.save(user);
    return { message: approved ? 'ID approved — user is now ID verified' : 'ID rejected', isIdVerified: approved };
  }

  async bulkUserAction(ids: number[], action: 'activate' | 'deactivate' | 'grant_admin' | 'revoke_admin') {
    if (!ids.length) throw new BadRequestException('No user IDs provided');
    const users = await this.usersRepo.findByIds(ids);
    for (const user of users) {
      if (action === 'activate') user.isActive = true;
      else if (action === 'deactivate') user.isActive = false;
      else if (action === 'grant_admin') user.isAdmin = true;
      else if (action === 'revoke_admin') user.isAdmin = false;
    }
    await this.usersRepo.save(users);
    return { affected: users.length };
  }

  async bulkPropertyStatus(ids: number[], status: 'draft' | 'pending_review' | 'published' | 'archived') {
    if (!ids.length) throw new BadRequestException('No property IDs provided');
    await this.propertiesRepo
      .createQueryBuilder()
      .update()
      .set({ status, isActive: status === 'published' } as any)
      .where('id IN (:...ids)', { ids })
      .execute();
    return { affected: ids.length };
  }

  // ─── Properties ────────────────────────────────────────────────────────────
  async getProperties(status?: string, page = 1, limit = 20, search?: string) {
    const qb = this.propertiesRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.host', 'host')
      .leftJoinAndSelect('p.photos', 'photos')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('p.status = :status', { status });
    if (search) {
      const clause = 'p.title LIKE :s OR p.city LIKE :s OR p.country LIKE :s';
      status ? qb.andWhere(clause, { s: `%${search}%` }) : qb.where(clause, { s: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async togglePropertyStatus(propertyId: number, status: 'draft' | 'pending_review' | 'published' | 'archived') {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    property.status = status;
    property.isActive = status === 'published';
    return this.propertiesRepo.save(property);
  }

  // ─── Bookings ───────────────────────────────────────────────────────────────
  async getBookings(page = 1, limit = 20, status?: string, search?: string) {
    const qb = this.bookingsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.property', 'property')
      .leftJoinAndSelect('b.guest', 'guest')
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('b.status = :status', { status });
    if (search) {
      const clause = 'guest.email LIKE :s OR guest.firstName LIKE :s OR property.title LIKE :s';
      status ? qb.andWhere(clause, { s: `%${search}%` }) : qb.where(clause, { s: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async confirmPayment(bookingId: number) {
    return this.bookingsService.confirmPayment(bookingId, 0, true);
  }

  async declinePayment(bookingId: number, reason?: string) {
    return this.bookingsService.declinePayment(bookingId, 0, true, reason);
  }

  async markInstapayRefunded(bookingId: number, reason?: string) {
    return this.bookingsService.markInstapayRefunded(bookingId, reason);
  }

  /** 2.3 — Cancelled InstaPay bookings with paymentStatus = 'paid' awaiting manual refund */
  async getInstapayRefundsPending() {
    return this.bookingsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.property', 'property')
      .leftJoinAndSelect('b.guest', 'guest')
      .where('b.status = :status', { status: 'cancelled' })
      .andWhere('b.paymentMethod = :method', { method: 'instapay' })
      .andWhere('b.paymentStatus = :paymentStatus', { paymentStatus: 'paid' })
      .orderBy('b.cancelledAt', 'DESC')
      .getMany();
  }

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  async getReviews(page = 1, limit = 20, search?: string) {
    const qb = this.reviewsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reviewer', 'guest')
      .leftJoinAndSelect('r.property', 'property')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where(
        'guest.firstName LIKE :s OR guest.lastName LIKE :s OR guest.email LIKE :s OR property.title LIKE :s',
        { s: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    // Remap reviewer → guest for frontend compatibility
    const mappedItems = items.map((r: any) => ({ ...r, guest: r.reviewer }));
    return { items: mappedItems, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteReview(reviewId: number) {
    const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewsRepo.remove(review);
    return { message: 'Review deleted' };
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboardStats(from?: string, to?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().split('T')[0];

    // Period boundaries for the date-range filter (defaults to current month)
    const periodStart = from ? new Date(from) : startOfMonth;
    const periodEnd = to
      ? (() => { const d = new Date(to); d.setHours(23, 59, 59, 999); return d; })()
      : now;

    const [
      totalUsers, activeUsers, totalHosts, newThisMonth, newThisWeek,
      totalProperties, publishedProperties, draftProperties, archivedProperties,
      totalBookings, completedBookings, pendingBookings, confirmedBookings, cancelledBookings,
      todayCheckIns, todayCheckOuts,
      revenueTotal, revenueMonth, revenueWeek,
      recentBookings,
      pendingPayouts, openDisputes, pendingIdVerifications,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { isActive: true } }),
      this.usersRepo.count({ where: { isHost: true } }),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM users WHERE created_at >= ?`, [startOfMonth],
      ).then((r: any[]) => parseInt(r[0].cnt)),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM users WHERE created_at >= ?`, [startOfWeek],
      ).then((r: any[]) => parseInt(r[0].cnt)),
      this.propertiesRepo.count(),
      this.propertiesRepo.count({ where: { status: 'published' } }),
      this.propertiesRepo.count({ where: { status: 'draft' } }),
      this.propertiesRepo.count({ where: { status: 'archived' } }),
      this.bookingsRepo.count(),
      this.bookingsRepo.count({ where: { status: 'completed' } }),
      this.bookingsRepo.count({ where: { status: 'pending' } }),
      this.bookingsRepo.count({ where: { status: 'confirmed' } }),
      this.bookingsRepo.count({ where: { status: 'cancelled' } }),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM bookings WHERE check_in = ?`, [todayStr],
      ).then((r: any[]) => parseInt(r[0].cnt)),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM bookings WHERE check_out = ?`, [todayStr],
      ).then((r: any[]) => parseInt(r[0].cnt)),
      this.bookingsRepo.createQueryBuilder('b').select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.paymentStatus = :ps', { ps: 'paid' }).getRawOne(),
      this.bookingsRepo.createQueryBuilder('b').select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.paymentStatus = :ps', { ps: 'paid' }).andWhere('b.createdAt >= :d', { d: startOfMonth }).getRawOne(),
      this.bookingsRepo.createQueryBuilder('b').select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.paymentStatus = :ps', { ps: 'paid' }).andWhere('b.createdAt >= :d', { d: startOfWeek }).getRawOne(),
      this.bookingsRepo.find({
        relations: ['property', 'guest'],
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.payoutsRepo.count({ where: { status: 'pending' } }),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM disputes WHERE status = 'open'`)
        .then((r: any[]) => parseInt(r[0].cnt)),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM users WHERE id_verification_status = 'pending'`)
        .then((r: any[]) => parseInt(r[0].cnt)),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, hosts: totalHosts, guests: totalUsers - totalHosts, newThisMonth, newThisWeek },
      properties: { total: totalProperties, published: publishedProperties, draft: draftProperties, archived: archivedProperties },
      bookings: { total: totalBookings, completed: completedBookings, pending: pendingBookings, confirmed: confirmedBookings, cancelled: cancelledBookings, todayCheckIns, todayCheckOuts },
      revenue: {
        total: parseFloat(revenueTotal?.v ?? '0'),
        thisMonth: parseFloat(revenueMonth?.v ?? '0'),
        thisWeek: parseFloat(revenueWeek?.v ?? '0'),
        currency: 'EGP',
      },
      pendingActions: {
        pendingPayouts,
        openDisputes,
        pendingIdVerifications,
      },
      recentBookings,
      period: await this._getPeriodStats(periodStart, periodEnd),
    };
  }

  private async _getPeriodStats(periodStart: Date, periodEnd: Date) {
    const [newUsers, revenueRaw, bookings, confirmed, cancelled] = await Promise.all([
      this.dataSource
        .query(
          `SELECT COUNT(*) AS cnt FROM users WHERE created_at >= ? AND created_at <= ?`,
          [periodStart, periodEnd],
        )
        .then((r: any[]) => parseInt(r[0].cnt, 10)),
      this.bookingsRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.totalAmount),0)', 'v')
        .where('b.paymentStatus = :ps', { ps: 'paid' })
        .andWhere('b.createdAt >= :pStart', { pStart: periodStart })
        .andWhere('b.createdAt <= :pEnd', { pEnd: periodEnd })
        .getRawOne(),
      this.bookingsRepo.count({ where: { createdAt: Between(periodStart, periodEnd) } }),
      this.bookingsRepo.count({ where: { status: 'confirmed', createdAt: Between(periodStart, periodEnd) } }),
      this.bookingsRepo.count({ where: { status: 'cancelled', createdAt: Between(periodStart, periodEnd) } }),
    ]);
    return {
      from: periodStart.toISOString(),
      to: periodEnd.toISOString(),
      newUsers,
      revenue: parseFloat(revenueRaw?.v ?? '0'),
      bookings,
      confirmedBookings: confirmed,
      cancelledBookings: cancelled,
    };
  }

  async getRevenueChart() {
    const rows = await this.dataSource.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COALESCE(SUM(total_amount), 0)   AS revenue,
        COUNT(*)                          AS bookings
      FROM bookings
      WHERE payment_status = 'paid'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);
    return rows.map((r: any) => ({
      month: r.month,
      revenue: parseFloat(r.revenue),
      bookings: parseInt(r.bookings),
    }));
  }

  // ─── Payouts ────────────────────────────────────────────────────────────────
  async getPayouts(page = 1, limit = 20, status?: string) {
    const qb = this.payoutsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.host', 'host')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('p.status = :status', { status });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async processPayout(payoutId: number, status: 'processing' | 'completed' | 'failed', adminNote?: string) {
    const payout = await this.payoutsRepo.findOne({
      where: { id: payoutId },
      relations: ['host'],
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status === 'completed') throw new BadRequestException('Payout already completed');

    payout.status = status;
    if (adminNote) payout.note = adminNote;
    if (status === 'completed') {
      payout.processedAt = new Date();
    }
    const saved = await this.payoutsRepo.save(payout);

    if (status === 'completed' && payout.host) {
      const host = payout.host;
      const amountStr = Number(payout.amount).toFixed(2);
      const currency = payout.currency ?? 'EGP';
      const ref = `PO-${payout.id}`;

      // In-app notification
      await this.notificationsService.create(
        host.id,
        'payout_completed',
        'Payout Processed',
        'تم تحويل المدفوعات',
        `Your payout of ${amountStr} ${currency} has been transferred.`,
        `تم تحويل ${amountStr} ${currency} إلى حسابك.`,
        { payoutId: payout.id },
      );

      // Email notification
      try {
        const fe = process.env.FRONTEND_URL?.split(',')?.[0]?.trim() ?? 'http://localhost:3000';
        const earningsUrl = `${fe.replace(/\/+$/, '')}/en/hosting/earnings`;
        const processedDate = saved.processedAt
          ? new Date(saved.processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        await this.mail.send(
          host.email,
          `Payout of ${amountStr} ${currency} processed — Journey Stay`,
          tplPayoutProcessed(
            host.firstName,
            amountStr,
            currency,
            payout.method ?? 'bank_transfer',
            payout.accountDetails ?? 'N/A',
            ref,
            processedDate,
            earningsUrl,
          ),
        );
      } catch (e) {
        // Non-fatal — log only
        console.error(`[AdminService] Failed to send payout completion email: ${(e as Error).message}`);
      }
    }

    return saved;
  }

  // ─── Experience Bookings ────────────────────────────────────────────────────
  async getExperienceBookings(page = 1, limit = 20, status?: string, search?: string) {
    const qb = this.expBookingsRepo
      .createQueryBuilder('eb')
      .leftJoinAndSelect('eb.experience', 'exp')
      .leftJoinAndSelect('eb.guest', 'guest')
      .leftJoinAndSelect('eb.host', 'host')
      .orderBy('eb.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('eb.status = :status', { status });

    if (search) {
      qb.andWhere(
        'guest.firstName LIKE :s OR guest.lastName LIKE :s OR guest.email LIKE :s OR exp.title LIKE :s',
        { s: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async confirmExperiencePayment(id: number) {
    const booking = await this.expBookingsRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Experience booking not found');
    booking.paymentStatus = 'paid';
    return this.expBookingsRepo.save(booking);
  }

  // ─── Platform Settings ──────────────────────────────────────────────────────
  async getSettings() {
    return this.settingsRepo.find({ order: { key: 'ASC' } });
  }

  async updateSetting(key: string, value: string) {
    const setting = await this.settingsRepo.findOne({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting '${key}' not found`);
    setting.value = value;
    return this.settingsRepo.save(setting);
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────
  async getAnalytics(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const [totalBookings, completedBookings, cancelledBookings, revenueData, userGrowth, recentProperties] =
      await Promise.all([
        this.bookingsRepo.createQueryBuilder('b')
          .where('b.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
          .getCount(),
        this.bookingsRepo.createQueryBuilder('b')
          .where('b.status = :s', { s: 'completed' })
          .andWhere('b.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
          .getCount(),
        this.bookingsRepo.createQueryBuilder('b')
          .where('b.status = :s', { s: 'cancelled' })
          .andWhere('b.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
          .getCount(),
        this.dataSource.query(`
          SELECT DATE_FORMAT(created_at,'%Y-%m') AS month,
            COALESCE(SUM(total_amount),0) AS revenue,
            COUNT(*) AS bookings
          FROM bookings
          WHERE payment_status = 'paid'
            AND created_at BETWEEN ? AND ?
          GROUP BY month ORDER BY month ASC
        `, [fromDate, toDate]),
        this.dataSource.query(`
          SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS users
          FROM users
          WHERE created_at BETWEEN ? AND ?
          GROUP BY month ORDER BY month ASC
        `, [fromDate, toDate]),
        this.dataSource.query(`
          SELECT DATE_FORMAT(created_at,'%Y-%m') AS month,
            SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published,
            SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS draft
          FROM properties
          WHERE created_at BETWEEN ? AND ?
          GROUP BY month ORDER BY month ASC
        `, [fromDate, toDate]),
      ]);

    const totalRevenue = (revenueData as any[]).reduce((s, r) => s + parseFloat(r.revenue), 0);
    const avgBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    return {
      period: { from: fromDate, to: toDate },
      totals: {
        bookings: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        revenue: totalRevenue,
        avgBookingValue,
        conversionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0',
        cancellationRate: totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : '0',
      },
      revenueByMonth: (revenueData as any[]).map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue),
        bookings: parseInt(r.bookings),
      })),
      userGrowthByMonth: (userGrowth as any[]).map((r) => ({
        month: r.month,
        users: parseInt(r.users),
      })),
      propertiesByMonth: (recentProperties as any[]).map((r) => ({
        month: r.month,
        published: parseInt(r.published),
        draft: parseInt(r.draft),
      })),
    };
  }

  // ─── Notification Blast ────────────────────────────────────────────────────
  async getNotificationHistory(page = 1, limit = 20) {
    const [items, total] = await this.notificationsRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async sendNotificationBlast(
    audience: 'all' | 'hosts' | 'guests',
    type: string,
    title: string,
    message: string,
  ) {
    let users: UserEntity[];
    if (audience === 'hosts') {
      users = await this.usersRepo.find({ where: { isHost: true, isActive: true } });
    } else if (audience === 'guests') {
      users = await this.usersRepo.find({ where: { isHost: false, isAdmin: false, isActive: true } });
    } else {
      users = await this.usersRepo.find({ where: { isActive: true } });
    }

    for (const user of users) {
      await this.notificationsService.create(
        user.id, type, title, title, message, message, { blast: true, audience },
      );
    }
    return { sent: users.length, audience, type, title };
  }

  // ─── Badge Counts (lightweight nav indicators) ────────────────────────────
  async getBadgeCounts() {
    const [pendingPayouts, openDisputes, pendingVerifications] = await Promise.all([
      this.payoutsRepo.count({ where: { status: 'pending' } }),
      this.dataSource
        .query(`SELECT COUNT(*) AS cnt FROM disputes WHERE status = 'open'`)
        .then((r: any[]) => parseInt(r[0].cnt, 10)),
      this.dataSource
        .query(`SELECT COUNT(*) AS cnt FROM users WHERE id_verification_status = 'pending'`)
        .then((r: any[]) => parseInt(r[0].cnt, 10)),
    ]);
    return { pendingPayouts, openDisputes, pendingVerifications };
  }

  // ─── System Health ─────────────────────────────────────────────────────────
  async getSystemHealth() {
    const start = Date.now();
    let dbStatus: 'ok' | 'error' = 'ok';
    let dbLatencyMs = 0;
    let totalUsers = 0;
    let totalProperties = 0;
    let totalBookings = 0;

    try {
      const t0 = Date.now();
      [totalUsers, totalProperties, totalBookings] = await Promise.all([
        this.usersRepo.count(),
        this.propertiesRepo.count(),
        this.bookingsRepo.count(),
      ]);
      dbLatencyMs = Date.now() - t0;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      api: 'ok',
      database: dbStatus,
      dbLatencyMs,
      apiLatencyMs: Date.now() - start,
      storage: 'ok',
      queue: 'ok',
      counts: { totalUsers, totalProperties, totalBookings },
      checkedAt: new Date().toISOString(),
    };
  }

  // ─── Email Blast ───────────────────────────────────────────────────────────
  async sendEmailBlast(
    subject: string,
    body: string,
    audience: 'all' | 'hosts' | 'guests',
  ) {
    let users: UserEntity[];
    if (audience === 'hosts') {
      users = await this.usersRepo.find({ where: { isHost: true, isActive: true } });
    } else if (audience === 'guests') {
      users = await this.usersRepo.find({ where: { isHost: false, isAdmin: false, isActive: true } });
    } else {
      users = await this.usersRepo.find({ where: { isActive: true } });
    }

    let sent = 0;
    for (const user of users) {
      try {
        await this.mail.sendAdminBlast(user.email, user.firstName ?? 'User', subject, body);
        sent++;
      } catch { /* skip individual failures */ }
    }
    return { sent, total: users.length, audience, subject };
  }
}
