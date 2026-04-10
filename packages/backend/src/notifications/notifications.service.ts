import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Subject, Observable, filter, map } from 'rxjs';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /** In-process event bus — emits every time a notification is created */
  private readonly notificationSubject = new Subject<{ userId: number; notification: NotificationEntity }>();

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationsRepo: Repository<NotificationEntity>,
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

  /** Daily cleanup: delete notifications older than 30 days */
  @Cron('0 3 * * *') // Runs at 03:00 AM every day
  async cleanupOldNotifications(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const result = await this.notificationsRepo.delete({
      createdAt: LessThan(cutoff),
    });
    if ((result.affected ?? 0) > 0) {
      this.logger.log(`Deleted ${result.affected} notifications older than 30 days`);
    }
  }
}
