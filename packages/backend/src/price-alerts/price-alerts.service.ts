import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceAlertEntity } from '../entities/price-alert.entity';
import { PropertyEntity } from '../entities/property.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PriceAlertsService {
  constructor(
    @InjectRepository(PriceAlertEntity)
    private readonly alertsRepo: Repository<PriceAlertEntity>,
    @InjectRepository(PropertyEntity)
    private readonly propertiesRepo: Repository<PropertyEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(userId: number): Promise<PriceAlertEntity[]> {
    return this.alertsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    userId: number,
    propertyId: number,
    targetPrice: number,
  ): Promise<PriceAlertEntity> {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    if (targetPrice <= 0) throw new BadRequestException('Target price must be greater than 0');

    // One active alert per user+property — upsert
    const existing = await this.alertsRepo.findOne({
      where: { userId, propertyId },
    });

    if (existing) {
      existing.targetPrice = targetPrice;
      existing.lastKnownPrice = Number(property.pricePerNight);
      existing.active = true;
      existing.notifiedAt = null;
      return this.alertsRepo.save(existing);
    }

    return this.alertsRepo.save(
      this.alertsRepo.create({
        userId,
        propertyId,
        targetPrice,
        lastKnownPrice: Number(property.pricePerNight),
        active: true,
      }),
    );
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    const alert = await this.alertsRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Price alert not found');
    if (Number(alert.userId) !== Number(userId))
      throw new ForbiddenException('Not your alert');
    await this.alertsRepo.remove(alert);
    return { message: 'Price alert removed' };
  }

  async deleteByProperty(propertyId: number, userId: number): Promise<{ message: string }> {
    const alert = await this.alertsRepo.findOne({ where: { userId, propertyId } });
    if (!alert) throw new NotFoundException('No price alert found for this property');
    await this.alertsRepo.remove(alert);
    return { message: 'Price alert removed' };
  }

  /** Returns the user's active alert for a specific property, or null */
  async findByProperty(propertyId: number, userId: number): Promise<PriceAlertEntity | null> {
    return this.alertsRepo.findOne({ where: { userId, propertyId, active: true } });
  }

  /**
   * Called immediately when a host changes a property's price.
   * Fires notifications for any active alert whose target is met by the new price.
   */
  async checkAlertsForProperty(propertyId: number, newPrice: number): Promise<void> {
    const alerts = await this.alertsRepo.find({ where: { propertyId, active: true } });
    if (!alerts.length) return;

    for (const alert of alerts) {
      if (newPrice <= Number(alert.targetPrice)) {
        // Price dropped to/below target — notify immediately
        await this.notificationsService.create(
          alert.userId,
          'price_drop',
          'Price drop alert!',
          'تنبيه انخفاض السعر!',
          `A property you're watching just dropped to ${newPrice}/night — at or below your target of ${alert.targetPrice}.`,
          `انخفض سعر عقار تراقبه إلى ${newPrice}/ليلة — عند هدفك أو أقل منه ${alert.targetPrice}.`,
          { propertyId, currentPrice: newPrice, targetPrice: alert.targetPrice },
        );
        alert.notifiedAt = new Date();
        alert.active = false; // one-shot alert — user must re-create to watch again
      }
      alert.lastKnownPrice = newPrice;
      await this.alertsRepo.save(alert);
    }
  }
}
