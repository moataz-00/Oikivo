import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { PropertyEntity } from '../entities/property.entity';
import { PropertyPhotoEntity } from '../entities/property-photo.entity';
import { BookingEntity } from '../entities/booking.entity';
import { AvailabilityEntity } from '../entities/availability.entity';
import { SearchDto } from './search.dto';

@Injectable()
export class SearchService implements OnModuleDestroy {
  private popularCitiesCache: { data: any[] | null; cachedAt: number } = { data: null, cachedAt: 0 };
  private static readonly CITIES_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  constructor(
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(PropertyPhotoEntity)
    private photosRepo: Repository<PropertyPhotoEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(AvailabilityEntity)
    private availabilityRepo: Repository<AvailabilityEntity>,
    private dataSource: DataSource,
  ) {}

  // ── Impression batch queue — flush every 30 s instead of per-request writes ──
  private impressionQueue: number[] = [];
  private impressionTimer: ReturnType<typeof setInterval> | null = null;

  // FIX S3: Flush pending impressions on shutdown so counts aren't lost
  async onModuleDestroy() {
    if (this.impressionTimer) {
      clearInterval(this.impressionTimer);
      this.impressionTimer = null;
    }
    await this.flushImpressions();
  }

  private enqueueImpressions(ids: number[]) {
    this.impressionQueue.push(...ids);
    if (!this.impressionTimer) {
      this.impressionTimer = setInterval(() => this.flushImpressions(), 30_000);
    }
  }

  private async flushImpressions() {
    if (this.impressionQueue.length === 0) return;
    const ids = [...new Set(this.impressionQueue)];
    this.impressionQueue = [];
    try {
      await this.propertiesRepo
        .createQueryBuilder()
        .update()
        .set({ impressionCount: () => 'impression_count + 1' })
        .whereInIds(ids)
        .execute();
    } catch { /* swallow — non-critical */ }
  }

  async search(dto: SearchDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    // Phase 1: fetch property IDs only (no cartesian product from photos join)
    const query = this.propertiesRepo
      .createQueryBuilder('property')
      .select('property.id', 'id')
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
      // Exclude properties that have confirmed/pending/in_progress bookings overlapping with requested dates
      const subQuery = this.bookingsRepo
        .createQueryBuilder('booking')
        .select('booking.propertyId')
        .where('booking.status IN (:...statuses)', { statuses: ['pending', 'confirmed', 'in_progress'] })
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

    // Amenities filter — single subquery with COUNT instead of N EXISTS
    if (dto.amenityIds && dto.amenityIds.length > 0) {
      query.andWhere(
        `property.id IN (
          SELECT pa.property_id FROM property_amenities pa
          WHERE pa.amenity_id IN (:...amenityIds)
          GROUP BY pa.property_id
          HAVING COUNT(DISTINCT pa.amenity_id) = :amenityCount
        )`,
        { amenityIds: dto.amenityIds, amenityCount: dto.amenityIds.length },
      );
    }

    // Phase 1: get matching IDs + total count
    const countQuery = query.clone();
    const total = await countQuery.getCount();

    // Sorting — applied to ID query
    switch (dto.sortBy) {
      case 'price_asc':
        query.addSelect('property.pricePerNight', 'pricePerNight');
        query.orderBy('property.pricePerNight', 'ASC');
        break;
      case 'price_desc':
        query.addSelect('property.pricePerNight', 'pricePerNight');
        query.orderBy('property.pricePerNight', 'DESC');
        break;
      case 'newest':
        query.addSelect('property.createdAt', 'createdAt');
        query.orderBy('property.createdAt', 'DESC');
        break;
      default:
        query
          .addSelect('property.avgRating', 'avgRating')
          .addSelect('property.reviewCount', 'reviewCount')
          .addSelect('property.impressionCount', 'impressionCount')
          .addSelect('property.createdAt', 'createdAt');
        query
          .orderBy('property.avgRating', 'DESC')
          .addOrderBy('property.reviewCount', 'DESC')
          .addOrderBy('property.impressionCount', 'DESC')
          .addOrderBy('property.createdAt', 'DESC');
    }

    const rawIds = await query
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const ids: number[] = rawIds.map((r) => r.id);

    if (ids.length === 0) {
      return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Phase 2: load full entities for the matched IDs (no cartesian product)
    const items = await this.propertiesRepo.find({
      where: { id: In(ids) },
      relations: ['photos', 'host', 'category'],
      select: {
        id: true, uuid: true, title: true, description: true,
        city: true, state: true, country: true, countryCode: true, address: true,
        latitude: true, longitude: true,
        pricePerNight: true, weekendPrice: true, currency: true,
        cleaningFee: true, serviceFeePercent: true, securityDeposit: true,
        weeklyDiscount: true, monthlyDiscount: true,
        spaceType: true, propertyKind: true, bedrooms: true, beds: true, bathrooms: true,
        maxGuests: true, minNights: true, maxNights: true,
        instantBook: true, avgRating: true, reviewCount: true,
        status: true, isActive: true, hostId: true, categoryId: true,
        createdAt: true, updatedAt: true,
        cancellationPolicy: true, bookingMode: true,
        newListingPromotionEnabled: true, lastMinuteDiscountPercent: true,
        host: { id: true, firstName: true, lastName: true, avatarUrl: true, isIdVerified: true },
      },
    });

    // Preserve sort order from Phase 1
    const idOrder = new Map(ids.map((id, i) => [id, i]));
    items.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

    // Batch impression increment (non-blocking)
    this.enqueueImpressions(ids);

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
        p.id, p.uuid, p.title, p.description,
        p.city, p.state, p.country, p.country_code AS countryCode,
        p.address, p.latitude, p.longitude,
        p.price_per_night AS pricePerNight, p.weekend_price AS weekendPrice,
        p.currency, p.cleaning_fee AS cleaningFee,
        p.space_type AS spaceType, p.property_kind AS propertyKind,
        p.bedrooms, p.beds, p.bathrooms, p.max_guests AS maxGuests,
        p.min_nights AS minNights, p.max_nights AS maxNights,
        p.instant_book AS instantBook, p.avg_rating AS avgRating,
        p.review_count AS reviewCount, p.category_id AS categoryId,
        p.host_id AS hostId, p.cancellation_policy AS cancellationPolicy,
        p.created_at AS createdAt,
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
    const now = Date.now();
    if (this.popularCitiesCache.data && now - this.popularCitiesCache.cachedAt < SearchService.CITIES_CACHE_TTL) {
      return this.popularCitiesCache.data;
    }

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

    const mapped = results.map((r) => ({
      city: r.city,
      country: r.country,
      countryCode: r.countryCode,
      propertyCount: parseInt(r.propertyCount),
      avgRating: parseFloat(r.avgRating) || 0,
    }));

    this.popularCitiesCache = { data: mapped, cachedAt: Date.now() };
    return mapped;
  }
}
