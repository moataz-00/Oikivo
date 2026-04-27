import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { UserEntity } from '../entities/user.entity';

/**
 * Firebase Cloud Messaging push notification service.
 *
 * Uses the firebase-admin SDK (FCM HTTP v1 API). The legacy FCM server key API
 * was deprecated by Google in June 2024 and is shut down.
 *
 * Setup (pick one):
 *   Option A — Service account JSON env var:
 *     Set FIREBASE_SERVICE_ACCOUNT=<JSON string of your serviceAccount.json>
 *   Option B — Application Default Credentials:
 *     Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *
 *   Then:
 *     - Mobile apps register FCM tokens via PATCH /users/me/push-token
 *     - NotificationsService calls sendPush() when creating notifications
 *
 * See: https://firebase.google.com/docs/cloud-messaging/migrate-v1
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly messagingApp: admin.app.App | null;

  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
  ) {
    this.messagingApp = this.initFirebase();
  }

  private initFirebase(): admin.app.App | null {
    // Avoid re-initializing if already done (e.g. hot reload in dev)
    try {
      return admin.app('push-service');
    } catch {
      // Not yet initialized — continue
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      try {
        const credential = admin.credential.cert(JSON.parse(serviceAccountJson));
        return admin.initializeApp({ credential }, 'push-service');
      } catch (err) {
        this.logger.error(
          `Failed to initialize Firebase from FIREBASE_SERVICE_ACCOUNT: ${(err as Error).message}`,
        );
        return null;
      }
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        return admin.initializeApp(
          { credential: admin.credential.applicationDefault() },
          'push-service',
        );
      } catch (err) {
        this.logger.error(
          `Failed to initialize Firebase via ADC: ${(err as Error).message}`,
        );
        return null;
      }
    }

    this.logger.warn(
      'Push notifications disabled: set FIREBASE_SERVICE_ACCOUNT or ' +
      'GOOGLE_APPLICATION_CREDENTIALS to enable.',
    );
    return null;
  }

  async registerToken(userId: number, fcmToken: string): Promise<void> {
    await this.usersRepo.update(userId, { fcmToken });
  }

  async removeToken(userId: number): Promise<void> {
    await this.usersRepo.update(userId, { fcmToken: null });
  }

  async sendPush(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (!this.messagingApp) return; // Firebase not configured — skip silently

    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'fcmToken'],
    });
    if (!user?.fcmToken) return;

    // FCM data values must be strings
    const stringData: Record<string, string> = data
      ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
      : {};

    try {
      await this.messagingApp.messaging().send({
        token: user.fcmToken,
        notification: { title, body },
        data: stringData,
      });
    } catch (err) {
      this.logger.error(`FCM push error for user ${userId}: ${(err as Error).message}`);
    }
  }
}
