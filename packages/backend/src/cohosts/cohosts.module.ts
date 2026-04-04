import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CohostsController, CohostInvitesController } from './cohosts.controller';
import { CohostsService } from './cohosts.service';
import { CoHostGuard } from '../common/guards/cohost.guard';
import { CoHostEntity } from '../entities/cohost.entity';
import { PropertyEntity } from '../entities/property.entity';
import { UserEntity } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([CoHostEntity, PropertyEntity, UserEntity]),
    NotificationsModule,
  ],
  controllers: [CohostsController, CohostInvitesController],
  providers: [CohostsService, CoHostGuard],
  exports: [CohostsService, CoHostGuard],
})
export class CohostsModule {}
