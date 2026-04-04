import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { PropertyEntity } from './property.entity';
import { AmenityEntity } from './amenity.entity';

@Entity('property_amenities')
export class PropertyAmenityEntity {
  @PrimaryColumn({ name: 'property_id', type: 'bigint', unsigned: true })
  propertyId: number;

  @PrimaryColumn({ name: 'amenity_id', type: 'int', unsigned: true })
  amenityId: number;

  @ManyToOne(() => PropertyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @ManyToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: AmenityEntity;
}
