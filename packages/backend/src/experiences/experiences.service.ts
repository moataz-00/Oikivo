import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ExperienceEntity } from '../entities/experience.entity';
import { ExperienceCategoryEntity } from '../entities/experience-category.entity';
import { ExperiencePhotoEntity } from '../entities/experience-photo.entity';
import { ExperienceItineraryEntity } from '../entities/experience-itinerary.entity';
import { ExperienceScheduleEntity } from '../entities/experience-schedule.entity';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectRepository(ExperienceEntity)
    private experiencesRepo: Repository<ExperienceEntity>,
    @InjectRepository(ExperienceCategoryEntity)
    private categoriesRepo: Repository<ExperienceCategoryEntity>,
    @InjectRepository(ExperiencePhotoEntity)
    private photosRepo: Repository<ExperiencePhotoEntity>,
    @InjectRepository(ExperienceItineraryEntity)
    private itineraryRepo: Repository<ExperienceItineraryEntity>,
    @InjectRepository(ExperienceScheduleEntity)
    private scheduleRepo: Repository<ExperienceScheduleEntity>,
    private dataSource: DataSource,
  ) {}

  async create(hostId: number, dto: CreateExperienceDto): Promise<ExperienceEntity> {
    const { itinerary, schedule, ...experienceData } = dto;

    const experience = this.experiencesRepo.create({
      ...experienceData,
      hostId,
      status: 'draft',
    });

    const saved = await this.experiencesRepo.save(experience);

    if (itinerary && itinerary.length > 0) {
      const steps = itinerary.map((step) =>
        this.itineraryRepo.create({
          experienceId: saved.id,
          stepNumber: step.stepNumber,
          title: step.title,
          description: step.description,
          durationMinutes: step.durationMinutes,
        }),
      );
      await this.itineraryRepo.save(steps);
    }

    if (schedule && schedule.length > 0) {
      const slots = schedule.map((slot) =>
        this.scheduleRepo.create({
          experienceId: saved.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      );
      await this.scheduleRepo.save(slots);
    }

    return this.findOne(saved.id);
  }

  async findOne(id: number): Promise<ExperienceEntity> {
    const experience = await this.experiencesRepo.findOne({
      where: { id },
      relations: ['photos', 'itinerary', 'schedule', 'host', 'category'],
    });
    if (!experience) throw new NotFoundException('Experience not found');
    return experience;
  }

  async findByUuid(uuid: string): Promise<ExperienceEntity> {
    const experience = await this.experiencesRepo.findOne({
      where: { uuid },
      relations: ['photos', 'itinerary', 'schedule', 'host', 'category'],
    });
    if (!experience) throw new NotFoundException('Experience not found');
    return experience;
  }

  async update(id: number, hostId: number, dto: UpdateExperienceDto): Promise<ExperienceEntity> {
    const experience = await this.findOne(id);
    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You do not own this experience');
    }

    const { itinerary, schedule, ...updateData } = dto;
    Object.assign(experience, updateData);
    await this.experiencesRepo.save(experience);

    if (itinerary !== undefined) {
      await this.itineraryRepo.delete({ experienceId: id });
      if (itinerary.length > 0) {
        const steps = itinerary.map((step) =>
          this.itineraryRepo.create({
            experienceId: id,
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description,
            durationMinutes: step.durationMinutes,
          }),
        );
        await this.itineraryRepo.save(steps);
      }
    }

    if (schedule !== undefined) {
      await this.scheduleRepo.delete({ experienceId: id });
      if (schedule.length > 0) {
        const slots = schedule.map((slot) =>
          this.scheduleRepo.create({
            experienceId: id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }),
        );
        await this.scheduleRepo.save(slots);
      }
    }

    return this.findOne(id);
  }

  async delete(id: number, hostId: number): Promise<{ message: string }> {
    const experience = await this.findOne(id);
    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You do not own this experience');
    }
    experience.status = 'archived';
    experience.archivedAt = new Date();
    await this.experiencesRepo.save(experience);
    return { message: 'Experience moved to archive' };
  }

  async publish(id: number, hostId: number): Promise<ExperienceEntity> {
    const experience = await this.findOne(id);
    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You do not own this experience');
    }
    if (!experience.pricePerPerson) {
      throw new BadRequestException('Price per person must be set before publishing');
    }
    if (!experience.city) {
      throw new BadRequestException('City must be set before publishing');
    }
    if (!experience.photos || experience.photos.length === 0) {
      throw new BadRequestException('At least one photo is required before publishing');
    }
    if (!experience.schedule || experience.schedule.length === 0) {
      throw new BadRequestException('At least one schedule slot is required before publishing');
    }
    experience.status = 'published';
    return this.experiencesRepo.save(experience);
  }

  async archive(id: number, hostId: number): Promise<ExperienceEntity> {
    const experience = await this.findOne(id);
    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You do not own this experience');
    }
    experience.status = 'archived';
    experience.archivedAt = new Date();
    return this.experiencesRepo.save(experience);
  }

  async restore(id: number, hostId: number): Promise<ExperienceEntity> {
    const experience = await this.findOne(id);
    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You do not own this experience');
    }
    if (experience.status !== 'archived') {
      throw new BadRequestException('Experience is not archived');
    }
    experience.status = 'draft';
    experience.archivedAt = null;
    return this.experiencesRepo.save(experience);
  }

  async getHostExperiences(hostId: number): Promise<ExperienceEntity[]> {
    return this.experiencesRepo.find({
      where: { hostId },
      relations: ['photos', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCategories(): Promise<ExperienceCategoryEntity[]> {
    return this.categoriesRepo.find({ order: { displayOrder: 'ASC' } });
  }

  async search(filters: {
    city?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
    language?: string;
    date?: string;
    instantBook?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const query = this.experiencesRepo
      .createQueryBuilder('experience')
      .leftJoinAndSelect('experience.photos', 'photos')
      .leftJoinAndSelect('experience.host', 'host')
      .leftJoinAndSelect('experience.category', 'category')
      .where('experience.status = :status', { status: 'published' });

    if (filters.city) {
      query.andWhere(
        '(experience.city LIKE :city OR experience.address LIKE :city)',
        { city: `%${filters.city}%` },
      );
    }

    if (filters.categoryId) {
      query.andWhere('experience.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.minPrice !== undefined) {
      query.andWhere('experience.pricePerPerson >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice !== undefined) {
      query.andWhere('experience.pricePerPerson <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.guests) {
      query.andWhere('experience.maxGuests >= :guests', {
        guests: filters.guests,
      });
    }

    if (filters.language) {
      query.andWhere('experience.language = :language', {
        language: filters.language,
      });
    }

    if (filters.instantBook !== undefined) {
      query.andWhere('experience.instantBook = :instantBook', {
        instantBook: filters.instantBook,
      });
    }

    if (filters.date) {
      const dayOfWeek = new Date(filters.date).getDay();
      query
        .innerJoin('experience.schedule', 'schedule')
        .andWhere('schedule.dayOfWeek = :dayOfWeek', { dayOfWeek })
        .andWhere('schedule.isActive = 1');
    }

    const total = await query.getCount();

    const items = await query
      .orderBy('experience.avgRating', 'DESC')
      .addOrderBy('experience.totalBookings', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  calculatePrice(
    experience: ExperienceEntity,
    guestsCount: number,
  ): {
    pricePerPerson: number;
    subtotal: number;
    discountAmount: number;
    serviceFee: number;
    totalAmount: number;
  } {
    const pricePerPerson = Number(experience.pricePerPerson);
    const subtotal = parseFloat((pricePerPerson * guestsCount).toFixed(2));

    let discountAmount = 0;
    const groupDiscount = Number(experience.groupDiscountPercent || 0);
    if (guestsCount >= 5 && groupDiscount > 0) {
      discountAmount = parseFloat(((subtotal * groupDiscount) / 100).toFixed(2));
    }

    const discountedBase = parseFloat((subtotal - discountAmount).toFixed(2));
    const serviceFee = parseFloat(((discountedBase * 14) / 100).toFixed(2));
    const totalAmount = parseFloat((discountedBase + serviceFee).toFixed(2));

    return { pricePerPerson, subtotal, discountAmount, serviceFee, totalAmount };
  }

  async getPricePreview(
    experienceId: number,
    guestsCount: number,
  ) {
    const experience = await this.findOne(experienceId);
    return this.calculatePrice(experience, guestsCount);
  }
}
