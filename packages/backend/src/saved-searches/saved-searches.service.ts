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
    if (Number(saved.userId) !== Number(userId))
      throw new ForbiddenException('Not your saved search');
    await this.savedSearchesRepo.remove(saved);
    return { message: 'Saved search deleted' };
  }

  /** G8: Toggle alert notification for a saved search */
  async toggleAlert(id: number, userId: number): Promise<SavedSearchEntity> {
    const saved = await this.savedSearchesRepo.findOne({ where: { id } });
    if (!saved) throw new NotFoundException('Saved search not found');
    if (Number(saved.userId) !== Number(userId))
      throw new ForbiddenException('Not your saved search');
    saved.alertEnabled = !saved.alertEnabled;
    return this.savedSearchesRepo.save(saved);
  }

  /** G8: Get all searches with alerts enabled (used by scheduler) */
  async findWithAlertsEnabled(): Promise<SavedSearchEntity[]> {
    return this.savedSearchesRepo.find({
      where: { alertEnabled: true },
    });
  }
}
