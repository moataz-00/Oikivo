import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistEntity } from '../entities/wishlist.entity';
import { WishlistItemEntity } from '../entities/wishlist-item.entity';
import { PropertyEntity } from '../entities/property.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(WishlistEntity)
    private wishlistsRepo: Repository<WishlistEntity>,
    @InjectRepository(WishlistItemEntity)
    private wishlistItemsRepo: Repository<WishlistItemEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
  ) {}

  async create(userId: number, dto: CreateWishlistDto): Promise<WishlistEntity> {
    const wishlist = this.wishlistsRepo.create({
      userId,
      name: dto.name,
      visibility: dto.visibility || 'private',
    });
    return this.wishlistsRepo.save(wishlist);
  }

  async findAll(userId: number): Promise<WishlistEntity[]> {
    return this.wishlistsRepo.find({
      where: { userId },
      relations: ['items', 'items.property', 'items.property.photos'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<WishlistEntity> {
    const wishlist = await this.wishlistsRepo.findOne({
      where: { id },
      relations: ['items', 'items.property', 'items.property.photos', 'items.property.host'],
    });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId && wishlist.visibility !== 'public') {
      throw new ForbiddenException('Not authorized to view this wishlist');
    }
    return wishlist;
  }

  async update(id: number, userId: number, dto: Partial<CreateWishlistDto>): Promise<WishlistEntity> {
    const wishlist = await this.wishlistsRepo.findOne({ where: { id } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId) throw new ForbiddenException('Not your wishlist');

    Object.assign(wishlist, dto);
    return this.wishlistsRepo.save(wishlist);
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    const wishlist = await this.wishlistsRepo.findOne({ where: { id } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId) throw new ForbiddenException('Not your wishlist');

    await this.wishlistsRepo.remove(wishlist);
    return { message: 'Wishlist deleted' };
  }

  async addItem(wishlistId: number, userId: number, propertyId: number): Promise<WishlistItemEntity> {
    const wishlist = await this.wishlistsRepo.findOne({ where: { id: wishlistId } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId) throw new ForbiddenException('Not your wishlist');

    const property = await this.propertiesRepo.findOne({
      where: { id: propertyId, isActive: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    const existing = await this.wishlistItemsRepo.findOne({
      where: { wishlistId, propertyId },
    });
    if (existing) throw new ConflictException('Property already in wishlist');

    const item = this.wishlistItemsRepo.create({ wishlistId, propertyId });
    return this.wishlistItemsRepo.save(item);
  }

  async removeItem(wishlistId: number, userId: number, propertyId: number): Promise<{ message: string }> {
    const wishlist = await this.wishlistsRepo.findOne({ where: { id: wishlistId } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId) throw new ForbiddenException('Not your wishlist');

    const item = await this.wishlistItemsRepo.findOne({
      where: { wishlistId, propertyId },
    });
    if (!item) throw new NotFoundException('Item not found in wishlist');

    await this.wishlistItemsRepo.remove(item);
    return { message: 'Property removed from wishlist' };
  }

  /** G6: Fetch a wishlist by its share token — no auth required */
  async findByShareToken(token: string): Promise<WishlistEntity> {
    const wishlist = await this.wishlistsRepo.findOne({
      where: { shareToken: token },
      relations: ['items', 'items.property', 'items.property.photos'],
    });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }

  async isPropertyWishlisted(
    userId: number,
    propertyId: number,
  ): Promise<{ isWishlisted: boolean; wishlistId: number | null }> {
    const item = await this.wishlistItemsRepo
      .createQueryBuilder('item')
      .innerJoin('item.wishlist', 'wishlist', 'wishlist.userId = :userId', { userId })
      .where('item.propertyId = :propertyId', { propertyId })
      .getOne();

    return {
      isWishlisted: !!item,
      wishlistId: item ? item.wishlistId : null,
    };
  }
}
