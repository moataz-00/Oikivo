import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

/**
 * G4: Firebase Cloud Messaging push notification service.
 *
 * This service provides the infrastructure for sending push notifications.
 * To fully enable FCM:
 *   1. Set FIREBASE_SERVER_KEY env variable (or use firebase-admin SDK)
 *   2. Mobile apps register their FCM tokens via PATCH /users/me/push-token
 *   3. Notifications service calls sendPush() when creating notifications
 *
 * Currently uses the FCM HTTP v1 API with a server key.
 * For production, switch to firebase-admin SDK with service account.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly FCM_URL = 'https://fcm.googleapis.com/fcm/send';

  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
  ) {}

  async registerToken(userId: number, fcmToken: string): Promise<void> {
    await this.usersRepo.update(userId, { fcmToken });
  }

  async removeToken(userId: number): Promise<void> {
    await this.usersRepo.update(userId, { fcmToken: null });
  }

  async sendPush(userId: number, title: string, body: string, data?: Record<string, any>): Promise<void> {
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    if (!serverKey) return; // FCM not configured — skip silently

    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'fcmToken'],
    });
    if (!user?.fcmToken) return;

    try {
      const response = await fetch(this.FCM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${serverKey}`,
        },
        body: JSON.stringify({
          to: user.fcmToken,
          notification: { title, body },
          data: data ?? {},
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`FCM push failed for user ${userId}: ${text}`);
      }
    } catch (err) {
      this.logger.error(`FCM push error for user ${userId}: ${(err as Error).message}`);
    }
  }
}
