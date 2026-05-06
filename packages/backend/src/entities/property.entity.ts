import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, ManyToMany, JoinTable, JoinColumn, BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { UserEntity } from './user.entity';
import { CategoryEntity } from './category.entity';
import { AmenityEntity } from './amenity.entity';
import { PropertyPhotoEntity } from './property-photo.entity';
import { HouseRuleEntity } from './house-rule.entity';
import { BookingEntity } from './booking.entity';
import { ReviewEntity } from './review.entity';

@Entity('properties')
export class PropertyEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ unique: true, length: 36, nullable: true })
  uuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }

  @Column({ name: 'host_id', type: 'bigint', unsigned: true })
  hostId: number;

  @ManyToOne(() => UserEntity, (u) => u.properties, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column({ name: 'category_id', type: 'int', unsigned: true, nullable: true })
  categoryId: number;

  @ManyToOne(() => CategoryEntity, (c) => c.properties, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'space_type',
    type: 'enum',
    enum: ['entire_place', 'private_room', 'shared_room'],
    default: 'entire_place',
  })
  spaceType: string;

  @Column({ name: 'property_kind', length: 100, default: 'apartment' })
  propertyKind: string;

  @Column({ name: 'price_per_night', type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  pricePerNight: number | null;

  @Column({ name: 'weekend_price', type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  weekendPrice: number | null;

  @Column({ name: 'weekly_discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  weeklyDiscount: number;

  @Column({ name: 'monthly_discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  monthlyDiscount: number;

  @Column({ name: 'new_listing_promotion_enabled', type: 'boolean', default: false })
  newListingPromotionEnabled: boolean;

  @Column({ name: 'last_minute_discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  lastMinuteDiscountPercent: number;

  @Column({
    name: 'booking_mode',
    type: 'enum',
    enum: ['instant_book', 'approve_first_three', 'always_approve'],
    default: 'instant_book',
  })
  bookingMode: string;

  @Column({ name: 'approved_bookings_count', type: 'int', unsigned: true, default: 0 })
  approvedBookingsCount: number;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ name: 'cleaning_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  cleaningFee: number;

  @Column({ name: 'security_deposit', type: 'decimal', precision: 10, scale: 2, default: 0 })
  securityDeposit: number;

  @Column({ name: 'service_fee_percent', type: 'decimal', precision: 5, scale: 2, default: 5.00 })
  serviceFeePercent: number;

  @Column({ name: 'host_commission_percent', type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  hostCommissionPercent: number;

  @Column({ name: 'min_nights', default: 1 })
  minNights: number;

  @Column({ name: 'max_nights', default: 365 })
  maxNights: number;

  @Column({ name: 'turnover_days', type: 'tinyint', default: 1 })
  turnoverDays: number;

  @Column({ name: 'max_guests', default: 1 })
  maxGuests: number;

  @Column({ default: 0 })
  bedrooms: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 1.0 })
  bathrooms: number;

  @Column({ default: 1 })
  beds: number;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ length: 150, nullable: true })
  city: string;

  @Column({ length: 150, nullable: true })
  state: string;

  @Column({ length: 150, nullable: true })
  country: string;

  @Column({ name: 'country_code', length: 2, nullable: true })
  countryCode: string;

  @Column({ name: 'postal_code', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ length: 64, nullable: true, comment: 'IANA timezone (e.g. Africa/Cairo, America/New_York)' })
  timezone: string | null;

  @Column({ name: 'check_in_after', type: 'time', default: '15:00:00' })
  checkInAfter: string;

  @Column({ name: 'check_out_before', type: 'time', default: '11:00:00' })
  checkOutBefore: string;

  @Column({ name: 'check_in_instructions', type: 'text', nullable: true, comment: 'WiFi passwords, door codes, entry instructions' })
  checkInInstructions: string | null;

  @Column({ name: 'wifi_name', type: 'varchar', length: 100, nullable: true })
  wifiName: string | null;

  @Column({ name: 'wifi_password', type: 'varchar', length: 100, nullable: true })
  wifiPassword: string | null;

  @Column({ name: 'door_code', type: 'varchar', length: 50, nullable: true })
  doorCode: string | null;

  @Column({ name: 'allows_pets', default: false })
  allowsPets: boolean;

  @Column({ name: 'allows_smoking', default: false })
  allowsSmoking: boolean;

  @Column({ name: 'allows_parties', default: false })
  allowsParties: boolean;

  @Column({ name: 'allows_children', default: true })
  allowsChildren: boolean;

  @Column({ name: 'instant_book', default: false })
  instantBook: boolean;

  // Computed helper: true when booking_mode is instant_book OR when
  // approve_first_three mode has already graduated (≥3 approved bookings)
  get effectiveInstantBook(): boolean {
    return (
      this.bookingMode === 'instant_book' ||
      (this.bookingMode === 'approve_first_three' && this.approvedBookingsCount >= 3)
    );
  }

  @Column({
    name: 'cancellation_policy',
    type: 'enum',
    enum: ['flexible', 'moderate', 'strict'],
    default: 'flexible',
  })
  cancellationPolicy: string;
  /** H4: Only verified guests can book this listing */
  @Column({ name: 'require_verified_guest', default: false })
  requireVerifiedGuest: boolean;

  /** H5: Minimum guest rating required to book (null = no restriction) */
  @Column({ name: 'min_guest_rating', type: 'decimal', precision: 2, scale: 1, nullable: true, default: null })
  minGuestRating: number | null;
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ['draft', 'pending_review', 'published', 'archived'], default: 'draft' })
  status: string;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'view_count', type: 'int', unsigned: true, default: 0 })
  viewCount: number;

  @Column({ name: 'impression_count', type: 'int', unsigned: true, default: 0 })
  impressionCount: number;

  /** Highest wizard step the host has saved (0 = legacy/unknown → all verify checks apply) */
  @Column({ name: 'wizard_last_step', type: 'int', default: 0 })
  wizardLastStep: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'timestamp', nullable: true, default: null })
  archivedAt: Date | null;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true, default: null })
  deletedAt: Date | null;

  @Column({ name: 'is_featured', type: 'tinyint', default: 0 })
  isFeatured: boolean;

  @Column({ name: 'geo_point', type: 'point', spatialFeatureType: 'Point', srid: 4326, select: false })
  geoPoint: string;

  @OneToMany(() => PropertyPhotoEntity, (p) => p.property, { cascade: true, orphanedRowAction: 'delete' })
  photos: PropertyPhotoEntity[];

  @ManyToMany(() => AmenityEntity, (a) => a.properties)
  @JoinTable({
    name: 'property_amenities',
    joinColumn: { name: 'property_id' },
    inverseJoinColumn: { name: 'amenity_id' },
  })
  amenities: AmenityEntity[];

  @OneToMany(() => HouseRuleEntity, (r) => r.property)
  houseRules: HouseRuleEntity[];

  @OneToMany(() => BookingEntity, (b) => b.property)
  bookings: BookingEntity[];

  @OneToMany(() => ReviewEntity, (r) => r.property)
  reviews: ReviewEntity[];
}
