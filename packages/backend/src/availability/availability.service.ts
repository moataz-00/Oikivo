import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In, DataSource } from 'typeorm';
import { AvailabilityEntity } from '../entities/availability.entity';
import { BookingEntity } from '../entities/booking.entity';
import { PropertyEntity } from '../entities/property.entity';
import { BlockDatesDto, SeasonalPricingDto } from './dto/block-dates.dto';
import { BulkBlockDatesDto, BulkSeasonalPricingDto } from './dto/bulk-listing-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilityEntity)
    private availabilityRepo: Repository<AvailabilityEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    private dataSource: DataSource,
  ) {}

  async getCalendar(propertyId: number, year: number, month: number) {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Get availability overrides
    const availabilityRows = await this.availabilityRepo.find({
      where: {
        propertyId,
        date: Between(startStr, endStr),
      },
    });

    // Get active bookings in range (FIX A1: include in_progress)
    const bookings = await this.bookingsRepo
      .createQueryBuilder('booking')
      .where('booking.propertyId = :propertyId', { propertyId })
      .andWhere('booking.status IN (:...statuses)', { statuses: ['pending', 'confirmed', 'in_progress'] })
      .andWhere('booking.checkIn <= :endStr', { endStr })
      .andWhere('booking.checkOut >= :startStr', { startStr })
      .getMany();

    // Build set of booked dates
    const bookedDates = new Set<string>();
    for (const booking of bookings) {
      const ci = new Date(booking.checkIn);
      const co = new Date(booking.checkOut);
      for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
        bookedDates.add(d.toISOString().split('T')[0]);
      }
    }

    // Build calendar days
    const days: Array<{
      date: string;
      isBlocked: boolean;
      isBooked: boolean;
      price: number;
      priceOverride: number | null;
      source: string;
    }> = [];

    const avMap = new Map(availabilityRows.map((a) => [a.date, a]));

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const avRow = avMap.get(dateStr);
      const dow = d.getDay(); // 5=Friday, 6=Saturday
      const isWeekend = dow === 5 || dow === 6;
      const weekendPrice =
        property.weekendPrice != null ? Number(property.weekendPrice) : null;
      const defaultPrice =
        isWeekend && weekendPrice != null
          ? weekendPrice
          : Number(property.pricePerNight);
      days.push({
        date: dateStr,
        isBlocked: avRow?.isBlocked ?? false,
        isBooked: bookedDates.has(dateStr),
        price: avRow?.priceOverride ? Number(avRow.priceOverride) : defaultPrice,
        priceOverride: avRow?.priceOverride ? Number(avRow.priceOverride) : null,
        source: bookedDates.has(dateStr) ? 'booking' : (avRow?.source ?? 'host'),
      });
    }

    return {
      propertyId,
      year,
      month,
      pricePerNight: Number(property.pricePerNight),
      currency: property.currency,
      days,
    };
  }

  async blockDates(propertyId: number, hostId: number, dto: BlockDatesDto) {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== hostId) throw new ForbiddenException('Not your property');

    // FIX A2: Warn if blocking dates that overlap with confirmed/in_progress bookings
    const conflictingBookings: string[] = [];
    if (dto.isBlocked && dto.dates.length > 0) {
      const sortedDates = [...dto.dates].sort();
      const minDate = sortedDates[0];
      const maxDate = sortedDates[sortedDates.length - 1];
      const bookings = await this.bookingsRepo
        .createQueryBuilder('booking')
        .where('booking.propertyId = :propertyId', { propertyId })
        .andWhere('booking.status IN (:...statuses)', {
          statuses: ['confirmed', 'in_progress'],
        })
        .andWhere('booking.checkIn <= :maxDate', { maxDate })
        .andWhere('booking.checkOut > :minDate', { minDate })
        .getMany();

      const dateSet = new Set(dto.dates);
      for (const booking of bookings) {
        const ci = new Date(booking.checkIn);
        const co = new Date(booking.checkOut);
        for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
          const ds = d.toISOString().split('T')[0];
          if (dateSet.has(ds)) {
            conflictingBookings.push(`Booking #${booking.id} (${booking.checkIn} – ${booking.checkOut})`);
            break;
          }
        }
      }

      if (conflictingBookings.length > 0) {
        throw new BadRequestException(
          `Cannot block dates that overlap with active bookings: ${conflictingBookings.join(', ')}. Cancel the bookings first.`,
        );
      }
    }

    const results: AvailabilityEntity[] = [];

    // FIX A4: Bulk upsert instead of N separate queries
    if (dto.dates.length > 0) {
      const values = dto.dates.map(date => ({
        propertyId,
        date,
        isBlocked: dto.isBlocked,
        priceOverride: dto.priceOverride ?? null,
        source: 'host' as const,
      }));

      const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const params: any[] = [];
      for (const v of values) {
        params.push(v.propertyId, v.date, v.isBlocked, v.priceOverride, v.source);
      }

      await this.dataSource.query(
        `INSERT INTO availability (propertyId, date, isBlocked, priceOverride, source)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE isBlocked = VALUES(isBlocked),
           priceOverride = COALESCE(VALUES(priceOverride), priceOverride),
           source = VALUES(source)`,
        params,
      );

      const inserted = await this.availabilityRepo.find({
        where: { propertyId, date: In(dto.dates) },
      });
      results.push(...inserted);
    }

    return results;
  }

  async setSeasonalPricing(propertyId: number, hostId: number, dto: SeasonalPricingDto) {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== hostId) throw new ForbiddenException('Not your property');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start > end) throw new BadRequestException('startDate must be before endDate');

    // FIX A4: Bulk upsert instead of N separate queries
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    if (dates.length > 0) {
      const placeholders = dates.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const params: any[] = [];
      for (const date of dates) {
        params.push(propertyId, date, false, dto.pricePerNight, 'host');
      }

      await this.dataSource.query(
        `INSERT INTO availability (propertyId, date, isBlocked, priceOverride, source)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE priceOverride = VALUES(priceOverride)`,
        params,
      );
    }

    return {
      propertyId,
      label: dto.label,
      startDate: dto.startDate,
      endDate: dto.endDate,
      pricePerNight: dto.pricePerNight,
      datesUpdated: dates.length,
    };
  }

  async bulkBlockDates(hostId: number, dto: BulkBlockDatesDto) {
    const propertyIds = Array.from(new Set(dto.propertyIds));
    const properties = await this.propertiesRepo.find({
      where: { id: In(propertyIds) },
      select: ['id', 'hostId'],
    });

    const ownedIds = new Set(properties.filter((p) => p.hostId === hostId).map((p) => p.id));
    const updated: number[] = [];
    const failed: number[] = [];

    for (const propertyId of propertyIds) {
      if (!ownedIds.has(propertyId)) {
        failed.push(propertyId);
        continue;
      }

      try {
        await this.blockDates(propertyId, hostId, {
          dates: dto.dates,
          isBlocked: dto.isBlocked,
          priceOverride: dto.priceOverride,
        });
        updated.push(propertyId);
      } catch {
        failed.push(propertyId);
      }
    }

    return {
      action: 'bulk_block_dates',
      updated,
      failed,
      datesCount: dto.dates.length,
      isBlocked: dto.isBlocked,
    };
  }

  async bulkSeasonalPricing(hostId: number, dto: BulkSeasonalPricingDto) {
    const propertyIds = Array.from(new Set(dto.propertyIds));
    const properties = await this.propertiesRepo.find({
      where: { id: In(propertyIds) },
      select: ['id', 'hostId'],
    });

    const ownedIds = new Set(properties.filter((p) => p.hostId === hostId).map((p) => p.id));
    const updated: number[] = [];
    const failed: number[] = [];

    for (const propertyId of propertyIds) {
      if (!ownedIds.has(propertyId)) {
        failed.push(propertyId);
        continue;
      }

      try {
        await this.setSeasonalPricing(propertyId, hostId, {
          startDate: dto.startDate,
          endDate: dto.endDate,
          pricePerNight: dto.pricePerNight,
          label: dto.label,
        });
        updated.push(propertyId);
      } catch {
        failed.push(propertyId);
      }
    }

    return {
      action: 'bulk_seasonal_pricing',
      updated,
      failed,
      startDate: dto.startDate,
      endDate: dto.endDate,
      pricePerNight: dto.pricePerNight,
    };
  }

  async getAvailableRanges(propertyId: number, from: string, to: string) {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const blocked = await this.availabilityRepo.find({
      where: {
        propertyId,
        date: Between(from, to),
        isBlocked: true,
      },
    });

    const bookedDates = new Set<string>();
    // FIX A1: include in_progress in availability range check
    const bookings = await this.bookingsRepo
      .createQueryBuilder('booking')
      .where('booking.propertyId = :propertyId', { propertyId })
      .andWhere('booking.status IN (:...statuses)', { statuses: ['pending', 'confirmed', 'in_progress'] })
      .andWhere('booking.checkIn <= :to', { to })
      .andWhere('booking.checkOut >= :from', { from })
      .getMany();

    for (const booking of bookings) {
      const ci = new Date(booking.checkIn);
      const co = new Date(booking.checkOut);
      for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
        bookedDates.add(d.toISOString().split('T')[0]);
      }
    }

    const blockedDates = new Set(blocked.map((b) => b.date));
    const unavailableDates = new Set([...blockedDates, ...bookedDates]);

    // Build available date ranges
    const ranges: Array<{ from: string; to: string }> = [];
    let rangeStart: string | null = null;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!unavailableDates.has(dateStr)) {
        if (!rangeStart) rangeStart = dateStr;
      } else {
        if (rangeStart) {
          ranges.push({ from: rangeStart, to: dateStr });
          rangeStart = null;
        }
      }
    }
    if (rangeStart) {
      ranges.push({ from: rangeStart, to: toDate.toISOString().split('T')[0] });
    }

    return ranges;
  }

  async isAvailable(propertyId: number, checkIn: string, checkOut: string): Promise<boolean> {
    // Check for blocked dates in range
    const blockedCount = await this.availabilityRepo
      .createQueryBuilder('av')
      .where('av.propertyId = :propertyId', { propertyId })
      .andWhere('av.date >= :checkIn', { checkIn })
      .andWhere('av.date < :checkOut', { checkOut })
      .andWhere('av.isBlocked = true')
      .getCount();

    if (blockedCount > 0) return false;

    // Check for overlapping bookings
    // FIX A1: Include 'in_progress' to prevent double-booking occupied properties
    const conflictCount = await this.bookingsRepo
      .createQueryBuilder('booking')
      .where('booking.propertyId = :propertyId', { propertyId })
      .andWhere('booking.status IN (:...statuses)', { statuses: ['pending', 'confirmed', 'in_progress'] })
      .andWhere('booking.checkIn < :checkOut', { checkOut })
      .andWhere('booking.checkOut > :checkIn', { checkIn })
      .getCount();

    return conflictCount === 0;
  }
}
