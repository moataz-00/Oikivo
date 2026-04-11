import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceAlertEntity } from '../entities/price-alert.entity';
import { PropertyEntity } from '../entities/property.entity';

@Injectable()
export class PriceAlertService {
  constructor(
    @InjectRepository(PriceAlertEntity)
    private priceAlertsRepo: Repository<PriceAlertEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
  ) {}

  async create(userId: number, propertyId: number, targetPrice: number): Promise<PriceAlertEntity> {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    // Only one active alert per user-property pair
    const existing = await this.priceAlertsRepo.findOne({
      where: { userId, propertyId, active: true },
    });
    if (existing) throw new ConflictException('You already have an active price alert for this property');

    const alert = this.priceAlertsRepo.create({
      userId,
      propertyId,
      targetPrice,
      lastKnownPrice: property.pricePerNight,
    });
    return this.priceAlertsRepo.save(alert);
  }

  async findMyAlerts(userId: number): Promise<PriceAlertEntity[]> {
    return this.priceAlertsRepo.find({
      where: { userId, active: true },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    const alert = await this.priceAlertsRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Price alert not found');
    if (alert.userId !== userId) throw new ForbiddenException('Not your alert');
    await this.priceAlertsRepo.remove(alert);
    return { message: 'Price alert removed' };
  }
}
