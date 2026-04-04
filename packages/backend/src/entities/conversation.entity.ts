import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn, UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PropertyEntity } from './property.entity';
import { BookingEntity } from './booking.entity';
import { MessageEntity } from './message.entity';

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'property_id', type: 'bigint', unsigned: true, nullable: true })
  propertyId: number;

  @ManyToOne(() => PropertyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ name: 'booking_id', type: 'bigint', unsigned: true, nullable: true })
  bookingId: number;

  @ManyToOne(() => BookingEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @Column({ name: 'host_id', type: 'bigint', unsigned: true })
  hostId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column({ name: 'guest_id', type: 'bigint', unsigned: true })
  guestId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guest_id' })
  guest: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  updatedAt: Date;

  @OneToMany(() => MessageEntity, (m) => m.conversation)
  messages: MessageEntity[];
}
