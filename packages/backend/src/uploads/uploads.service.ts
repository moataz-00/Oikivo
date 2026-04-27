import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PropertyPhotoEntity } from '../entities/property-photo.entity';
import { PropertyEntity } from '../entities/property.entity';
import { ExperiencePhotoEntity } from '../entities/experience-photo.entity';
import { ExperienceEntity } from '../entities/experience.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(PropertyPhotoEntity)
    private photosRepo: Repository<PropertyPhotoEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(ExperiencePhotoEntity)
    private expPhotosRepo: Repository<ExperiencePhotoEntity>,
    @InjectRepository(ExperienceEntity)
    private experiencesRepo: Repository<ExperienceEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
  ) {}

  // ─── Property photos ────────────────────────────────────────────────────────

  async savePropertyPhotos(
    propertyId: number,
    userId: number,
    files: Express.Multer.File[],
  ): Promise<PropertyPhotoEntity[]> {
    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new BadRequestException('Property not found');
    if (property.hostId !== userId) {
      throw new ForbiddenException('You do not own this property');
    }

    const existingCount = await this.photosRepo.count({ where: { propertyId } });
    const hasCover = await this.photosRepo.findOne({ where: { propertyId, isCover: true } });

    const photos: PropertyPhotoEntity[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = `/uploads/properties/${propertyId}/${file.filename}`;
      photos.push(this.photosRepo.create({
        propertyId,
        url,
        displayOrder: existingCount + i,
        isCover: !hasCover && i === 0,
      }));
    }
    return this.photosRepo.save(photos);
  }

  async deletePropertyPhoto(photoId: number, userId: number): Promise<{ message: string }> {
    const photo = await this.photosRepo.findOne({ where: { id: photoId }, relations: ['property'] });
    if (!photo) throw new BadRequestException('Photo not found');
    if (photo.property.hostId !== userId) throw new ForbiddenException('You do not own this photo');
    await this.photosRepo.remove(photo);
    return { message: 'Photo deleted' };
  }

  async setCoverPhoto(photoId: number, userId: number): Promise<{ message: string }> {
    const photo = await this.photosRepo.findOne({ where: { id: photoId }, relations: ['property'] });
    if (!photo) throw new BadRequestException('Photo not found');
    if (photo.property.hostId !== userId) throw new ForbiddenException('You do not own this photo');
    await this.photosRepo.update({ propertyId: photo.propertyId }, { isCover: false });
    await this.photosRepo.update(photoId, { isCover: true });
    return { message: 'Cover photo updated' };
  }

  async reorderPhotos(
    userId: number,
    photoOrders: Array<{ id: number; displayOrder: number }>,
  ): Promise<{ message: string }> {
    const orders = photoOrders ?? [];
    if (!orders.length) {
      throw new BadRequestException('No photo order payload provided');
    }

    const ids = orders.map((p) => p.id);
    const photos = await this.photosRepo.find({ where: { id: In(ids) }, relations: ['property'] });
    if (photos.length !== ids.length) {
      throw new BadRequestException('One or more photos were not found');
    }

    const allOwned = photos.every((p) => p.property.hostId === userId);
    if (!allOwned) {
      throw new ForbiddenException('You can only reorder photos for your own listings');
    }

    const propertyIds = new Set(photos.map((p) => p.propertyId));
    if (propertyIds.size !== 1) {
      throw new BadRequestException('Photos must belong to the same property');
    }

    for (const item of orders) {
      await this.photosRepo.update(item.id, { displayOrder: item.displayOrder });
    }

    return { message: 'Photos reordered' };
  }

  // ─── Experience photos ────────────────────────────────────────────────────────

  async saveExperiencePhotos(
    experienceId: number,
    userId: number,
    files: Express.Multer.File[],
  ): Promise<ExperiencePhotoEntity[]> {
    const experience = await this.experiencesRepo.findOne({ where: { id: experienceId } });
    if (!experience) throw new BadRequestException('Experience not found');
    if (experience.hostId !== userId) {
      throw new ForbiddenException('You do not own this experience');
    }

    const existingCount = await this.expPhotosRepo.count({ where: { experienceId } });
    const hasCover = await this.expPhotosRepo.findOne({ where: { experienceId, isCover: true } });

    const photos: ExperiencePhotoEntity[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = `/uploads/experiences/${experienceId}/${file.filename}`;
      photos.push(this.expPhotosRepo.create({
        experienceId,
        url,
        displayOrder: existingCount + i,
        isCover: !hasCover && i === 0,
      }));
    }
    return this.expPhotosRepo.save(photos);
  }

  async deleteExperiencePhoto(photoId: number, userId: number): Promise<{ message: string }> {
    const photo = await this.expPhotosRepo.findOne({ where: { id: photoId }, relations: ['experience'] });
    if (!photo) throw new BadRequestException('Photo not found');
    if (photo.experience.hostId !== userId) throw new ForbiddenException('You do not own this photo');
    await this.expPhotosRepo.remove(photo);
    return { message: 'Photo deleted' };
  }

  // ─── Avatar ──────────────────────────────────────────────────────────────────

  async updateAvatar(userId: number, avatarUrl: string): Promise<{ avatarUrl: string }> {
    await this.usersRepo.update(userId, { avatarUrl });
    return { avatarUrl };
  }
}
