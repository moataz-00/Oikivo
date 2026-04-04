import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PropertyEntity } from './property.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'name_ar', length: 100 })
  nameAr: string;

  @Column({ length: 100 })
  icon: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => PropertyEntity, (p) => p.category)
  properties: PropertyEntity[];
}
