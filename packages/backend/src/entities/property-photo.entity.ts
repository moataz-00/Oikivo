import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { PropertyEntity } from './property.entity';

@Entity('property_photos')
export class PropertyPhotoEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'property_id', type: 'bigint', unsigned: true })
  propertyId: number;

  @ManyToOne(() => PropertyEntity, (p) => p.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 255, nullable: true })
  caption: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_cover', default: false })
  isCover: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
