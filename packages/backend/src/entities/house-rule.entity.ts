import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PropertyEntity } from './property.entity';

@Entity('property_house_rules')
export class HouseRuleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'property_id', type: 'bigint', unsigned: true })
  propertyId: number;

  @ManyToOne(() => PropertyEntity, (p) => p.houseRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ length: 500 })
  rule: string;

  @Column({ name: 'rule_ar', length: 500, nullable: true })
  ruleAr: string;
}
