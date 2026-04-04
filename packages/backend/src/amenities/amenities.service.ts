import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AmenityEntity } from '../entities/amenity.entity';

@Injectable()
export class AmenitiesService {
  private _cache: { data: Record<string, AmenityEntity[]>; expiry: number } | null = null;
  private readonly TTL = 60 * 60 * 1000; // 1 hour

  constructor(
    @InjectRepository(AmenityEntity)
    private amenitiesRepo: Repository<AmenityEntity>,
  ) {}

  async findAll() {
    if (this._cache && Date.now() < this._cache.expiry) return this._cache.data;

    const amenities = await this.amenitiesRepo.find({
      order: { sortOrder: 'ASC' },
    });

    // Group by category
    const grouped = amenities.reduce(
      (acc, amenity) => {
        const cat = amenity.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(amenity);
        return acc;
      },
      {} as Record<string, AmenityEntity[]>,
    );

    this._cache = { data: grouped, expiry: Date.now() + this.TTL };
    return grouped;
  }

  async findByIds(ids: number[]): Promise<AmenityEntity[]> {
    if (!ids || ids.length === 0) return [];
    return this.amenitiesRepo.find({ where: { id: In(ids) } });
  }
}
