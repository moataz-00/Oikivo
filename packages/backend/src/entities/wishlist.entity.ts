import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';
import { UserEntity } from './user.entity';
import { WishlistItemEntity } from './wishlist-item.entity';

@Entity('wishlists')
export class WishlistEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => UserEntity, (u) => u.wishlists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ length: 150, default: 'Wishlist' })
  name: string;

  @Column({ type: 'enum', enum: ['private', 'public'], default: 'private' })
  visibility: string;

  /** G6: Unique token used to share a private wishlist via link */
  @Column({ name: 'share_token', length: 36, unique: true, nullable: true })
  shareToken: string | null;

  @BeforeInsert()
  generateShareToken() {
    if (!this.shareToken) {
      this.shareToken = randomUUID();
    }
  }

  @Column({ name: 'cover_photo', length: 500, nullable: true })
  coverPhoto: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => WishlistItemEntity, (i) => i.wishlist, { cascade: true })
  items: WishlistItemEntity[];
}
