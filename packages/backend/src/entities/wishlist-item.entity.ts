import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { WishlistEntity } from './wishlist.entity';
import { PropertyEntity } from './property.entity';

@Entity('wishlist_items')
@Unique(['wishlistId', 'propertyId'])
export class WishlistItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'wishlist_id', type: 'bigint', unsigned: true })
  wishlistId: number;

  @ManyToOne(() => WishlistEntity, (w) => w.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wishlist_id' })
  wishlist: WishlistEntity;

  @Column({ name: 'property_id', type: 'bigint', unsigned: true })
  propertyId: number;

  @ManyToOne(() => PropertyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}
