import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';
import { WishlistEntity } from '../entities/wishlist.entity';
import { WishlistItemEntity } from '../entities/wishlist-item.entity';
import { PropertyEntity } from '../entities/property.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WishlistEntity, WishlistItemEntity, PropertyEntity]),
  ],
  controllers: [WishlistsController],
  providers: [WishlistsService],
  exports: [WishlistsService],
})
export class WishlistsModule {}
