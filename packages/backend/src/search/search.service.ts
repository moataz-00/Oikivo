import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PropertyEntity } from '../entities/property.entity';
import { BookingEntity } from '../entities/booking.entity';
import { AvailabilityEntity } from '../entities/availability.entity';
import { SearchDto } from './search.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(AvailabilityEntity)
    private availabilityRepo: Repository<AvailabilityEntity>,
    private dataSource: DataSource,
  ) {}

  async search(dto: SearchDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    const query = this.propertiesRepo
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.photos', 'photos')
      .leftJoinAndSelect('property.host', 'host')
      .leftJoinAndSelect('property.category', 'category')
      .where('property.status = :status', { status: 'published' })
      .andWhere('property.isActive = true');

    // City / location filter
    if (dto.city) {
      query.andWhere('(property.city LIKE :city OR property.state LIKE :city OR property.country LIKE :city)', {
        city: `%${dto.city}%`,
      });
    }

    if (dto.country) {
      query.andWhere('property.country LIKE :country', { country: `%${dto.country}%` });
    }

    // Guests filter
    if (dto.guests) {
      query.andWhere('property.maxGuests >= :guests', { guests: dto.guests });
    }

    // Price range
    if (dto.minPrice !== undefined) {
      query.andWhere('property.pricePerNight >= :minPrice', { minPrice: dto.minPrice });
    }
    if (dto.maxPrice !== undefined) {
      query.andWhere('property.pricePerNight <= :maxPrice', { maxPrice: dto.maxPrice });
    }

    // Category
    if (dto.categoryId) {
      query.andWhere('property.categoryId = :categoryId', { categoryId: dto.categoryId });
    }

    // Space type
    if (dto.spaceType) {
      query.andWhere('property.spaceType = :spaceType', { spaceType: dto.spaceType });
    }

    // Property kind
    if (dto.propertyKind) {
      query.andWhere('property.propertyKind = :propertyKind', {
        propertyKind: dto.propertyKind,
      });
    }

    // Instant book
    if (dto.instantBook !== undefined) {
      query.andWhere('property.instantBook = :instantBook', { instantBook: dto.instantBook });
    }

    // Allows pets
    if (dto.allowsPets !== undefined) {
      query.andWhere('property.allowsPets = :allowsPets', { allowsPets: dto.allowsPets });
    }

    // Bedrooms
    if (dto.minBedrooms !== undefined) {
      query.andWhere('property.bedrooms >= :minBedrooms', { minBedrooms: dto.minBedrooms });
    }

    // Beds
    if (dto.minBeds !== undefined) {
      query.andWhere('property.beds >= :minBeds', { minBeds: dto.minBeds });
    }

    // Bathrooms
    if (dto.minBathrooms !== undefined) {
      query.andWhere('property.bathrooms >= :minBathrooms', { minBathrooms: dto.minBathrooms });
    }

    // Date availability check
    if (dto.checkIn && dto.checkOut) {
      // Exclude properties that have confirmed/pending bookings overlapping with requested dates
      const subQuery = this.bookingsRepo
        .createQueryBuilder('booking')
        .select('booking.propertyId')
        .where('booking.status IN (:...statuses)', { statuses: ['pending', 'confirmed'] })
        .andWhere('booking.checkIn < :checkOut', { checkOut: dto.checkOut })
        .andWhere('booking.checkOut > :checkIn', { checkIn: dto.checkIn });

      query.andWhere(`property.id NOT IN (${subQuery.getQuery()})`);
      query.setParameters({
        ...query.getParameters(),
        checkOut: dto.checkOut,
        checkIn: dto.checkIn,
      });

      // Also exclude properties with blocked dates in range
      const blockedSubQuery = this.availabilityRepo
        .createQueryBuilder('av')
        .select('av.propertyId')
        .where('av.isBlocked = true')
        .andWhere('av.date >= :avCheckIn', { avCheckIn: dto.checkIn })
        .andWhere('av.date < :avCheckOut', { avCheckOut: dto.checkOut });

      query.andWhere(`property.id NOT IN (${blockedSubQuery.getQuery()})`);
      query.setParameter('avCheckIn', dto.checkIn);
      query.setParameter('avCheckOut', dto.checkOut);
    }

    // Amenities filter (all must be present)
    if (dto.amenityIds && dto.amenityIds.length > 0) {
      for (let i = 0; i < dto.amenityIds.length; i++) {
        const amenityId = dto.amenityIds[i];
        const alias = `pa${i}`;
        query.andWhere(
          `EXISTS (SELECT 1 FROM property_amenities ${alias} WHERE ${alias}.property_id = property.id AND ${alias}.amenity_id = :amenityId${i})`,
          { [`amenityId${i}`]: amenityId },
        );
      }
    }

    // Sorting
    switch (dto.sortBy) {
      case 'price_asc':
        query.orderBy('property.pricePerNight', 'ASC');
        break;
      case 'price_desc':
        query.orderBy('property.pricePerNight', 'DESC');
        break;
      case 'newest':
        query.orderBy('property.createdAt', 'DESC');
        break;
      default:
        query
          .orderBy('property.avgRating', 'DESC')
          .addOrderBy('property.reviewCount', 'DESC')
          .addOrderBy('property.impressionCount', 'DESC')
          .addOrderBy('property.createdAt', 'DESC');
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Fire-and-forget: increment impression_count for each returned property
    if (items.length > 0) {
      const ids = items.map((p) => p.id);
      this.propertiesRepo.createQueryBuilder()
        .update()
        .set({ impressionCount: () => 'impression_count + 1' })
        .whereInIds(ids)
        .execute()
        .catch(() => {});
    }

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async nearbyProperties(lat: number, lng: number, radiusKm = 10, limit = 20) {
    // ── Bounding-box envelope for the SPATIAL INDEX pre-filter ─────────────────────────────
    // 1 degree latitude  ≈ 111 km everywhere.
    // 1 degree longitude ≈ 111 km × cos(latitude) — shrinks at higher latitudes.
    const deltaLat = radiusKm / 111.0;
    const cosLat   = Math.cos((lat * Math.PI) / 180);
    const deltaLng = cosLat !== 0 ? radiusKm / (111.0 * cosLat) : 180;

    const minLat = lat - deltaLat;
    const maxLat = lat + deltaLat;
    const minLng = lng - deltaLng;
    const maxLng = lng + deltaLng;

    // Pure JS numbers from controller-validated inputs — no SQL injection risk.
    const envelope =
      `POLYGON((${minLng} ${minLat},${maxLng} ${minLat},` +
      `${maxLng} ${maxLat},${minLng} ${maxLat},${minLng} ${minLat}))`;

    // Two-phase approach (MariaDB-compatible):
    //   Phase 1 — MBRWithin(geo_point, envelope) hits idx_properties_geo_point
    //             (SPATIAL INDEX), pruning candidates to the bounding-box square.
    //   Phase 2 — Haversine exact-distance filter on the small candidate set.
    //             (ST_Distance_Sphere is MySQL 8 only; Haversine works on MariaDB)
    const results = await this.dataSource.query(
      `
      SELECT
        p.*,
        (6371 * 2 * ASIN(SQRT(
          POWER(SIN(RADIANS((p.latitude - ?) / 2)), 2) +
          COS(RADIANS(?)) * COS(RADIANS(p.latitude)) *
          POWER(SIN(RADIANS((p.longitude - ?) / 2)), 2)
        ))) AS distance_km
      FROM properties p
      WHERE
        p.status = 'published'
        AND p.is_active = 1
        AND p.latitude  IS NOT NULL
        AND p.longitude IS NOT NULL
        AND MBRWithin(p.geo_point, ST_GeomFromText(?))
        AND (6371 * 2 * ASIN(SQRT(
          POWER(SIN(RADIANS((p.latitude - ?) / 2)), 2) +
          COS(RADIANS(?)) * COS(RADIANS(p.latitude)) *
          POWER(SIN(RADIANS((p.longitude - ?) / 2)), 2)
        ))) <= ?
      ORDER BY distance_km ASC
      LIMIT ?
      `,
      [lat, lat, lng, envelope, lat, lat, lng, radiusKm, limit],
    );

    return results;
  }

  async getPopularCities() {
    const results = await this.propertiesRepo
      .createQueryBuilder('property')
      .select('property.city', 'city')
      .addSelect('property.country', 'country')
      .addSelect('property.countryCode', 'countryCode')
      .addSelect('COUNT(property.id)', 'propertyCount')
      .addSelect('AVG(property.avgRating)', 'avgRating')
      .where('property.status = :status', { status: 'published' })
      .andWhere('property.isActive = true')
      .andWhere('property.city IS NOT NULL')
      .groupBy('property.city')
      .addGroupBy('property.country')
      .addGroupBy('property.countryCode')
      .orderBy('propertyCount', 'DESC')
      .limit(10)
      .getRawMany();

    return results.map((r) => ({
      city: r.city,
      country: r.country,
      countryCode: r.countryCode,
      propertyCount: parseInt(r.propertyCount),
      avgRating: parseFloat(r.avgRating) || 0,
    }));
  }
}
