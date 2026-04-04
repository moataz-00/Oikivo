import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  private _cache: { data: CategoryEntity[]; expiry: number } | null = null;
  private readonly TTL = 60 * 60 * 1000; // 1 hour

  constructor(
    @InjectRepository(CategoryEntity)
    private categoriesRepo: Repository<CategoryEntity>,
  ) {}

  async findAll(): Promise<CategoryEntity[]> {
    if (this._cache && Date.now() < this._cache.expiry) return this._cache.data;
    const data = await this.categoriesRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
    this._cache = { data, expiry: Date.now() + this.TTL };
    return data;
  }

  async findOne(id: number): Promise<CategoryEntity> {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}
