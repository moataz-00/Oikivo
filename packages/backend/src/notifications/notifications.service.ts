import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Subject, Observable, filter, map } from 'rxjs';
import { NotificationEntity } from '../entities/notification.entity';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /** In-process event bus — emits every time a notification is created */
  private readonly notificationSubject = new Subject<{ userId: number; notification: NotificationEntity }>();

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationsRepo: Repository<NotificationEntity>,
    private pushService: PushService,
  ) {}

  async create(
    userId: number,
    type: string,
    title: string,
    titleAr: string,
    body: string,
    bodyAr: string,
    data?: Record<string, any>,
  ): Promise<NotificationEntity> {
    const notification = this.notificationsRepo.create({
      userId,
      type,
      title,
      titleAr,
      body,
      bodyAr,
      dataJson: data || null,
    });
    const saved = await this.notificationsRepo.save(notification);

    // Push to SSE stream for connected clients
    this.notificationSubject.next({ userId, notification: saved });

    // Push via FCM for mobile clients
    this.pushService.sendPush(userId, title, body, data).catch((err) => {
      this.logger.warn(`FCM push failed for user ${userId}: ${err.message}`);
    });

    return saved;
  }

  /**
   * Returns an Observable<MessageEvent> for the given user.
   * Used by the SSE endpoint to push real-time notification events.
   */
  stream(userId: number): Observable<MessageEvent> {
    return this.notificationSubject.pipe(
      filter((event) => event.userId === userId),
      map((event) => ({ data: event.notification } as MessageEvent)),
    );
  }

  async findAll(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.notificationsRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markRead(id: number, userId: number): Promise<{ message: string }> {
    const result = await this.notificationsRepo.update({ id, userId }, { isRead: true });
    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('Notification not found');
    }
    return { message: 'Notification marked as read' };
  }

  async markAllRead(userId: number): Promise<{ message: string }> {
    await this.notificationsRepo.update({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.notificationsRepo.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  /** Daily cleanup: delete non-financial notifications older than 30 days.
   *  FIX O4: Financial notifications are preserved indefinitely for audit trail. */
  @Cron('0 3 * * *') // Runs at 03:00 AM every day
  async cleanupOldNotifications(): Promise<void> {
    const financialTypes = [
      'payment_received', 'payment_confirmed', 'refund_initiated',
      'payout_processed', 'payout_approved', 'payout_rejected',
      'instapay_refund_pending', 'earning_available', 'charge_disputed',
    ];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const result = await this.notificationsRepo
      .createQueryBuilder()
      .delete()
      .from(NotificationEntity)
      .where('created_at < :cutoff', { cutoff })
      .andWhere('type NOT IN (:...financialTypes)', { financialTypes })
      .execute();
    if ((result.affected ?? 0) > 0) {
      this.logger.log(`Deleted ${result.affected} non-financial notifications older than 30 days`);
    }
  }
}
