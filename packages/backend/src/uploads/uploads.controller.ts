import {
  Controller,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';
import { PropertyPhotoEntity } from '../entities/property-photo.entity';
import { PropertyEntity } from '../entities/property.entity';
import { ExperiencePhotoEntity } from '../entities/experience-photo.entity';
import { ExperienceEntity } from '../entities/experience.entity';

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function makeImageStorage(subDir: string) {
  return diskStorage({
    destination: (req, file, cb) => {
      const id = req.params.id || req.params.propertyId;
      const dir = join(process.cwd(), 'uploads', subDir, id);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `photo-${uniqueSuffix}${extname(file.originalname)}`);
    },
  });
}

const imageFilter = (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
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

  @Post('photos/:id')
  @ApiOperation({ summary: 'Upload photos for a property (up to 20)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: makeImageStorage('properties'),
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPhotos(
    @Param('id', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const property = await this.propertiesRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new BadRequestException('Property not found');
    if (property.hostId !== user.id) {
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

  @Delete('photos/:photoId')
  @ApiOperation({ summary: 'Delete a property photo' })
  async deletePhoto(
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser() user: UserEntity,
  ) {
    const photo = await this.photosRepo.findOne({ where: { id: photoId }, relations: ['property'] });
    if (!photo) throw new BadRequestException('Photo not found');
    if (photo.property.hostId !== user.id) throw new ForbiddenException('You do not own this photo');
    await this.photosRepo.remove(photo);
    return { message: 'Photo deleted' };
  }

  @Patch('photos/:photoId/cover')
  @ApiOperation({ summary: 'Set a photo as the cover photo' })
  async setCover(
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser() user: UserEntity,
  ) {
    const photo = await this.photosRepo.findOne({ where: { id: photoId }, relations: ['property'] });
    if (!photo) throw new BadRequestException('Photo not found');
    if (photo.property.hostId !== user.id) throw new ForbiddenException('You do not own this photo');
    await this.photosRepo.update({ propertyId: photo.propertyId }, { isCover: false });
    await this.photosRepo.update(photoId, { isCover: true });
    return { message: 'Cover photo updated' };
  }

  @Patch('photos/reorder')
  @ApiOperation({ summary: 'Reorder property photos' })
  async reorderPhotos(
    @CurrentUser() user: UserEntity,
    @Body() body: { photoOrders: Array<{ id: number; displayOrder: number }> },
  ) {
    const orders = body.photoOrders ?? [];
    if (!orders.length) {
      throw new BadRequestException('No photo order payload provided');
    }

    const ids = orders.map((p) => p.id);
    const photos = await this.photosRepo.find({ where: { id: In(ids) }, relations: ['property'] });
    if (photos.length !== ids.length) {
      throw new BadRequestException('One or more photos were not found');
    }

    const allOwned = photos.every((p) => p.property.hostId === user.id);
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

  @Post('experience-photos/:id')
  @ApiOperation({ summary: 'Upload photos for an experience (up to 10)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: makeImageStorage('experiences'),
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadExperiencePhotos(
    @Param('id', ParseIntPipe) experienceId: number,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const experience = await this.experiencesRepo.findOne({ where: { id: experienceId } });
    if (!experience) throw new BadRequestException('Experience not found');
    if (experience.hostId !== user.id) {
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

  @Delete('experience-photos/:photoId')
  @ApiOperation({ summary: 'Delete an experience photo' })
  async deleteExperiencePhoto(
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser() user: UserEntity,
  ) {
    const photo = await this.expPhotosRepo.findOne({ where: { id: photoId }, relations: ['experience'] });
    if (!photo) throw new BadRequestException('Photo not found');
    if (photo.experience.hostId !== user.id) throw new ForbiddenException('You do not own this photo');
    await this.expPhotosRepo.remove(photo);
    return { message: 'Photo deleted' };
  }

  // ─── Avatar ──────────────────────────────────────────────────────────────────

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'avatars');
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersRepo.update(user.id, { avatarUrl });
    return { avatarUrl };
  }
}
