import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedSearchEntity } from '../entities/saved-search.entity';

@Injectable()
export class SavedSearchesService {
  constructor(
    @InjectRepository(SavedSearchEntity)
    private savedSearchesRepo: Repository<SavedSearchEntity>,
  ) {}

  async findAll(userId: number): Promise<SavedSearchEntity[]> {
    return this.savedSearchesRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    userId: number,
    name: string,
    filters: Record<string, unknown>,
  ): Promise<SavedSearchEntity> {
    const entity = this.savedSearchesRepo.create({ userId, name, filters });
    return this.savedSearchesRepo.save(entity);
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    const saved = await this.savedSearchesRepo.findOne({ where: { id } });
    if (!saved) throw new NotFoundException('Saved search not found');
    if (saved.userId !== userId)
      throw new ForbiddenException('Not your saved search');
    await this.savedSearchesRepo.remove(saved);
    return { message: 'Saved search deleted' };
  }
}
