import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { PropertyEntity } from './property.entity';

@Entity('amenities')
export class AmenityEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'name_ar', length: 100 })
  nameAr: string;

  @Column({ length: 100 })
  icon: string;

  @Column({ type: 'enum', enum: ['essential', 'standout', 'safety'], default: 'essential' })
  category: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToMany(() => PropertyEntity, (p) => p.amenities)
  properties: PropertyEntity[];
}
