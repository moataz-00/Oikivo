import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { PropertyPhotoEntity } from '../entities/property-photo.entity';
import { PropertyEntity } from '../entities/property.entity';
import { ExperiencePhotoEntity } from '../entities/experience-photo.entity';
import { ExperienceEntity } from '../entities/experience.entity';
import { UserEntity } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PropertyPhotoEntity,
      PropertyEntity,
      ExperiencePhotoEntity,
      ExperienceEntity,
      UserEntity,
    ]),
    MulterModule.register({}),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
