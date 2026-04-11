import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';
import { PropertyEntity } from '../entities/property.entity';
import { PropertyPhotoEntity } from '../entities/property-photo.entity';
import { AmenityEntity } from '../entities/amenity.entity';
import { HouseRuleEntity } from '../entities/house-rule.entity';
import { ReviewEntity } from '../entities/review.entity';
import { UserEntity } from '../entities/user.entity';
import { BookingEntity } from '../entities/booking.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  weekendPrice: number | null;
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  discountedBase: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency: string;
  discountType?: 'monthly' | 'weekly' | 'last_minute' | 'new_listing_promotion' | null;
  newListingPromotionActive?: boolean;
  lastMinuteDiscountActive?: boolean;
}

// ─── Egyptian public holiday data (shared with bookings.service) ─────────────
const EG_FIXED_HOLIDAYS: [number, number][] = [
  [1, 7],   // Coptic Christmas
  [1, 25],  // Revolution Day
  [4, 25],  // Sinai Liberation Day
  [5, 1],   // Labour Day
  [6, 30],  // June 30 Revolution Day
  [7, 23],  // July 23 Revolution Day
  [10, 6],  // Armed Forces Day
];
const EG_ISLAMIC_HOLIDAYS: Record<number, [number, number][]> = {
  2025: [[3,30],[3,31],[4,1],[4,2],[6,6],[6,7],[6,8],[6,27],[9,4]],
  2026: [[3,20],[3,21],[3,22],[5,27],[5,28],[5,29],[6,17],[8,25]],
  2027: [[3,9],[3,10],[3,11],[5,16],[5,17],[5,18],[6,6],[8,14]],
};
function isEgyptianPublicHoliday(d: Date): boolean {
  const m = d.getMonth() + 1; const day = d.getDate();
  if (EG_FIXED_HOLIDAYS.some(([hm, hd]) => hm === m && hd === day)) return true;
  const yr = d.getFullYear();
  const islamic = EG_ISLAMIC_HOLIDAYS[yr];
  return !!(islamic && islamic.some(([hm, hd]) => hm === m && hd === day));
}
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    @InjectRepository(PropertyPhotoEntity)
    private photosRepo: Repository<PropertyPhotoEntity>,
    @InjectRepository(AmenityEntity)
    private amenitiesRepo: Repository<AmenityEntity>,
    @InjectRepository(HouseRuleEntity)
    private houseRulesRepo: Repository<HouseRuleEntity>,
    @InjectRepository(ReviewEntity)
    private reviewsRepo: Repository<ReviewEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    private dataSource: DataSource,
  ) {}

  async create(hostId: number, dto: CreateListingDto): Promise<PropertyEntity> {
    const { amenityIds, ...propertyData } = dto;

    const property = this.propertiesRepo.create({
      ...propertyData,
      hostId,
      currency: 'EGP',
      status: 'draft',
    });

    const saved = await this.propertiesRepo.save(property);

    if (amenityIds && amenityIds.length > 0) {
      await this.addAmenities(saved.id, amenityIds);
    }

    return this.findOne(saved.id);
  }

  async findOne(id: number): Promise<PropertyEntity> {
    const property = await this.propertiesRepo.findOne({
      where: { id },
      relations: ['photos', 'amenities', 'host', 'houseRules', 'category'],
    });

    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async findByUuid(uuid: string): Promise<PropertyEntity> {
    const property = await this.propertiesRepo.findOne({
      where: { uuid },
      relations: ['photos', 'amenities', 'host', 'houseRules', 'category'],
    });
    if (!property) throw new NotFoundException('Property not found');
    // Fire-and-forget view count increment (non-blocking)
    this.propertiesRepo.increment({ id: property.id }, 'viewCount', 1).catch(() => {});
    return property;
  }

  async update(id: number, hostId: number, dto: UpdateListingDto): Promise<PropertyEntity> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }

    const { amenityIds, ...updateData } = dto;
    Object.assign(property, updateData);
    await this.propertiesRepo.save(property);

    if (amenityIds !== undefined) {
      // Clear existing amenities and add new ones
      await this.dataSource.query(
        'DELETE FROM property_amenities WHERE property_id = ?',
        [id],
      );
      if (amenityIds.length > 0) {
        await this.addAmenities(id, amenityIds);
      }
    }

    return this.findOne(id);
  }

  async verifyListing(id: number, hostId: number) {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }

    const host = await this.usersRepo.findOne({ where: { id: hostId } });
    const photoCount = property.photos?.length ?? 0;
    const hasCover = property.photos?.some((p) => p.isCover) ?? false;
    const amenitiesCount = property.amenities?.length ?? 0;
    const houseRulesCount = property.houseRules?.length ?? 0;

    const checks: { key: string; label: string; status: 'pass' | 'fail'; message?: string }[] = [
      {
        key: 'title',
        label: 'Listing title',
        status: property.title ? 'pass' : 'fail',
        ...(!property.title && { message: 'Add a title for your listing.' }),
      },
      {
        key: 'description',
        label: 'Description',
        status: property.description ? 'pass' : 'fail',
        ...(!property.description && { message: 'Write a description for guests.' }),
      },
      {
        key: 'location',
        label: 'Location details',
        status: property.city && property.country ? 'pass' : 'fail',
        ...(!(property.city && property.country) && { message: 'Add your property city and country.' }),
      },
      {
        key: 'map_location',
        label: 'Map pin',
        status: property.latitude && property.longitude ? 'pass' : 'fail',
        ...(!(property.latitude && property.longitude) && { message: 'Set your property location on the map.' }),
      },
      {
        key: 'pricing',
        label: 'Nightly price set',
        status: property.pricePerNight && Number(property.pricePerNight) > 0 ? 'pass' : 'fail',
        ...(!(property.pricePerNight && Number(property.pricePerNight) > 0) && { message: 'Set a price per night.' }),
      },
      {
        key: 'category',
        label: 'Property category',
        status: property.categoryId ? 'pass' : 'fail',
        ...(!property.categoryId && { message: 'Choose a category for your property.' }),
      },
      {
        key: 'capacity',
        label: 'Guest capacity',
        status: property.maxGuests >= 1 ? 'pass' : 'fail',
        ...(property.maxGuests < 1 && { message: 'Set maximum number of guests.' }),
      },
      {
        key: 'photos',
        label: 'At least 5 photos',
        status: photoCount >= 5 ? 'pass' : 'fail',
        ...(photoCount < 5 && { message: `You have ${photoCount} photo${photoCount !== 1 ? 's' : ''}. Add at least ${5 - photoCount} more.` }),
      },
      {
        key: 'cover_photo',
        label: 'Cover photo set',
        status: hasCover ? 'pass' : 'fail',
        ...(!hasCover && { message: 'Mark one photo as the cover image.' }),
      },
      {
        key: 'cancellation',
        label: 'Cancellation policy',
        status: property.cancellationPolicy ? 'pass' : 'fail',
        ...(!property.cancellationPolicy && { message: 'Choose a cancellation policy.' }),
      },
      {
        key: 'amenities',
        label: 'At least 3 amenities',
        status: amenitiesCount >= 3 ? 'pass' : 'fail',
        ...(amenitiesCount < 3 && {
          message: `Add at least ${3 - amenitiesCount} more amenit${3 - amenitiesCount === 1 ? 'y' : 'ies'}.`,
        }),
      },
      {
        key: 'house_rules',
        label: 'House rules configured',
        status: houseRulesCount > 0 ? 'pass' : 'fail',
        ...(houseRulesCount === 0 && { message: 'Add at least one house rule before publishing.' }),
      },
      {
        key: 'host_email',
        label: 'Email verified',
        status: host?.isEmailVerified ? 'pass' : 'fail',
        ...(!host?.isEmailVerified && { message: 'Verify your email address.' }),
      },
      {
        key: 'host_photo',
        label: 'Profile photo',
        status: host?.avatarUrl ? 'pass' : 'fail',
        ...(!host?.avatarUrl && { message: 'Add a profile photo so guests know who you are.' }),
      },
      {
        key: 'host_phone',
        label: 'Phone number verified',
        status: host?.isPhoneVerified ? 'pass' : 'fail',
        ...(!host?.isPhoneVerified && {
          message: host?.phone
            ? 'Verify your phone number in account verification settings.'
            : 'Add and verify your phone number in account settings.',
        }),
      },
    ];

    // host_id is informational only — it no longer blocks canPublish
    const infoChecks: { key: string; label: string; status: 'pass' | 'info'; message?: string }[] = [
      {
        key: 'host_id',
        label: 'Government ID verified (optional)',
        status: host?.idVerificationStatus === 'approved' ? 'pass' : 'info',
        ...(host?.idVerificationStatus !== 'approved' && {
          message:
            host?.idVerificationStatus === 'pending'
              ? 'Your ID is under review — it will be shown as verified once approved.'
              : host?.idVerificationStatus === 'rejected'
              ? 'Your ID was rejected. Re-upload to get the verification badge.'
              : 'Uploading a government ID increases guest trust but is not required to publish.',
        }),
      },
      {
        key: 'weekend_price_warning',
        label: 'Weekend pricing sanity check',
        status:
          property.weekendPrice == null ||
          Number(property.weekendPrice) >= Number(property.pricePerNight ?? 0)
            ? 'pass'
            : 'info',
        ...(property.weekendPrice != null && Number(property.weekendPrice) < Number(property.pricePerNight ?? 0) && {
          message: 'Weekend price is below base nightly price. This is allowed, but may reduce weekend earnings.',
        }),
      },
    ];

    const passCount = checks.filter((c) => c.status === 'pass').length;

    return {
      propertyId: id,
      canPublish: passCount === checks.length,
      checks: [...checks, ...infoChecks],
      passCount,
      totalCount: checks.length,
    };
  }

  async publish(id: number, hostId: number): Promise<PropertyEntity> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }

    // Host profile requirements — must be met before any listing goes live
    const host = await this.usersRepo.findOne({ where: { id: hostId } });
    if (!host?.isEmailVerified) {
      throw new BadRequestException('Email verification required before publishing. Please verify your email address.');
    }
    if (!host?.isPhoneVerified) {
      throw new BadRequestException('Phone number must be verified before publishing. Add and verify your phone number in account settings.');
    }
    if (!host?.avatarUrl) {
      throw new BadRequestException('Profile photo required before publishing. Upload a photo in your profile settings.');
    }
    if (host?.idVerificationStatus !== 'approved') {
      throw new BadRequestException('Government ID verification is required before publishing your first listing.');
    }
    const cancellations = Number((host as any).hostCancelledBookingsCount ?? 0);
    if (cancellations >= 8) {
      throw new BadRequestException('Publishing is temporarily restricted due to repeated host-initiated cancellations. Please contact support.');
    }

    const readiness = await this.verifyListing(id, hostId);
    if (!readiness.canPublish) {
      const firstError = readiness.checks.find((c) => c.status === 'fail');
      throw new BadRequestException(firstError?.message || 'Listing is incomplete and cannot be published yet');
    }

    property.status = 'pending_review';
    property.isActive = false;
    return this.propertiesRepo.save(property);
  }

  async archive(id: number, hostId: number): Promise<PropertyEntity> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }

    const today = new Date().toISOString().split('T')[0];
    const futureBookings = await this.bookingsRepo.find({
      where: {
        propertyId: property.id,
        status: In(['pending', 'confirmed'] as any),
      } as any,
    });

    const targetedBookings = futureBookings.filter((b) => b.checkIn >= today);
    if (targetedBookings.length > 0) {
      for (const b of targetedBookings) {
        const amountPaid = Number(b.totalAmount ?? 0);
        const needsRefund = (b.paymentStatus === 'paid' || b.paymentStatus === 'submitted') && amountPaid > 0;
        await this.bookingsRepo.update(b.id, {
          status: 'cancelled',
          cancelledBy: 'host',
          cancelledAt: new Date(),
          cancellationReason: 'Listing archived by host. Booking cancelled with full refund.',
          refundAmount: needsRefund ? amountPaid : 0,
          cancellationFee: 0,
          paymentStatus: needsRefund ? 'refund_pending' : b.paymentStatus,
        } as any);
      }
    }

    property.status = 'archived';
    property.isActive = false;
    property.archivedAt = new Date();
    return this.propertiesRepo.save(property);
  }

  async transferProperty(id: number, hostId: number, newOwnerEmail: string): Promise<{ message: string }> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }
    const newOwner = await this.usersRepo.findOne({ where: { email: newOwnerEmail } });
    if (!newOwner) {
      throw new BadRequestException('No user found with that email address');
    }
    if (!newOwner.isHost) {
      throw new BadRequestException('The target user is not registered as a host');
    }
    if (newOwner.id === hostId) {
      throw new BadRequestException('You cannot transfer a property to yourself');
    }
    property.hostId = newOwner.id;
    await this.propertiesRepo.save(property);
    return { message: `Property transferred to ${newOwner.email}` };
  }

  async unpublish(id: number, hostId: number): Promise<PropertyEntity> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }
    if (property.status !== 'published') {
      throw new BadRequestException('Property is not published');
    }
    property.status = 'draft';
    property.isActive = false;
    return this.propertiesRepo.save(property);
  }

  async delete(id: number, hostId: number): Promise<{ message: string }> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }
    property.isActive = false;
    property.status = 'archived';
    property.archivedAt = new Date();
    await this.propertiesRepo.save(property);
    return { message: 'Property moved to archive' };
  }

  async restore(id: number, hostId: number): Promise<PropertyEntity> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }
    if (property.status !== 'archived') {
      throw new BadRequestException('Property is not archived');
    }
    property.status = 'draft';
    property.isActive = false;
    property.archivedAt = null;
    return this.propertiesRepo.save(property);
  }

  async permanentDelete(id: number, hostId: number): Promise<{ message: string }> {
    const property = await this.propertiesRepo.findOne({
      where: { id },
      relations: ['photos'],
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }

    // Delete physical photo files from disk
    const uploadsRoot = join(process.cwd(), 'uploads');
    for (const photo of property.photos ?? []) {
      try {
        // photo.url is like /uploads/properties/42/filename.jpg
        const relativePath = photo.url.replace(/^\//, '');
        const filePath = join(uploadsRoot, '..', relativePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        // Non-fatal — continue even if a file is missing
      }
    }

    // Try to remove property-specific folder
    try {
      const propDir = join(process.cwd(), 'uploads', 'properties', String(property.id));
      if (fs.existsSync(propDir)) fs.rmSync(propDir, { recursive: true, force: true });
    } catch { /* non-fatal */ }

    await this.propertiesRepo.remove(property);
    return { message: 'Property permanently deleted' };
  }

  async getArchivedListings(hostId: number): Promise<PropertyEntity[]> {
    return this.propertiesRepo.find({
      where: { hostId, status: 'archived' as any },
      relations: ['photos', 'category'],
      order: { archivedAt: 'DESC' },
    });
  }

  async getHostListings(hostId: number, page = 1, limit = 200) {
    const [items, total] = await this.propertiesRepo.findAndCount({
      where: { hostId },
      relations: ['photos', 'category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async addAmenities(propertyId: number, amenityIds: number[]): Promise<void> {
    const amenities = await this.amenitiesRepo.find({
      where: { id: In(amenityIds) },
    });

    await this.dataSource.query(
      `INSERT IGNORE INTO property_amenities (property_id, amenity_id) VALUES ${amenities.map(() => '(?, ?)').join(', ')}`,
      amenities.flatMap((a) => [propertyId, a.id]),
    );
  }

  async removeAmenity(propertyId: number, amenityId: number): Promise<void> {
    await this.dataSource.query(
      'DELETE FROM property_amenities WHERE property_id = ? AND amenity_id = ?',
      [propertyId, amenityId],
    );
  }

  async updateHouseRules(
    propertyId: number,
    rules: Array<{ rule: string; ruleAr?: string }>,
  ): Promise<HouseRuleEntity[]> {
    // Delete existing rules
    await this.houseRulesRepo.delete({ propertyId });

    // Insert new rules
    const newRules = rules.map((r) =>
      this.houseRulesRepo.create({ propertyId, rule: r.rule, ruleAr: r.ruleAr }),
    );

    return this.houseRulesRepo.save(newRules);
  }

  /** Sum per-night prices accounting for weekend pricing */
  private calculateNightlyBase(
    property: PropertyEntity,
    checkIn: string,
    checkOut: string,
  ): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const basePrice = Number(property.pricePerNight ?? 0);
    const weekendPrice =
      property.weekendPrice != null ? Number(property.weekendPrice) : null;

    let amount = 0;
    for (
      let d = new Date(checkInDate);
      d < checkOutDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dow = d.getDay(); // 5=Friday, 6=Saturday
      const isPeak = dow === 5 || dow === 6 || isEgyptianPublicHoliday(d);
      amount += isPeak && weekendPrice != null ? weekendPrice : basePrice;
    }
    return parseFloat(amount.toFixed(2));
  }

  calculatePrice(
    property: PropertyEntity,
    checkIn: string,
    checkOut: string,
    guests: number,
  ): PriceBreakdown {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (nights <= 0) throw new BadRequestException('Invalid date range');
    if (guests > property.maxGuests) {
      throw new BadRequestException(`Max guests allowed: ${property.maxGuests}`);
    }

    const pricePerNight = Number(property.pricePerNight ?? 0);
    const weekendPrice =
      property.weekendPrice != null ? Number(property.weekendPrice) : null;

    // Base amount using weekend pricing per night
    const baseAmount = this.calculateNightlyBase(property, checkIn, checkOut);

    // Apply length-of-stay discounts (monthly wins over weekly)
    const weeklyDiscount = Number(property.weeklyDiscount ?? 0);
    const monthlyDiscount = Number(property.monthlyDiscount ?? 0);
    const newListingPromoEnabled = !!property.newListingPromotionEnabled;
    const lastMinutePct = Number(property.lastMinuteDiscountPercent ?? 0);
    const approvedCount = Number(property.approvedBookingsCount ?? 0);

    // Determine booking date (today) for last-minute check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isLastMinute = daysUntilCheckIn <= 14 && daysUntilCheckIn >= 0;
    const isNewListingPromoActive = newListingPromoEnabled && approvedCount < 3;

    let discountPercent = 0;
    let discountType: PriceBreakdown['discountType'] = null;

    // Priority order: monthly > weekly > last_minute > new_listing_promotion
    if (nights >= 28 && monthlyDiscount > 0) {
      discountPercent = monthlyDiscount;
      discountType = 'monthly';
    } else if (nights >= 7 && weeklyDiscount > 0) {
      discountPercent = weeklyDiscount;
      discountType = 'weekly';
    } else if (isNewListingPromoActive) {
      discountPercent = 20;
      discountType = 'new_listing_promotion';
    } else if (isLastMinute && lastMinutePct > 0) {
      discountPercent = lastMinutePct;
      discountType = 'last_minute';
    }
    const discountAmount = parseFloat(
      ((baseAmount * discountPercent) / 100).toFixed(2),
    );
    const discountedBase = parseFloat((baseAmount - discountAmount).toFixed(2));

    const cleaningFee = Number(property.cleaningFee ?? 0);
    const serviceFee = parseFloat(
      (
        (discountedBase * Number(property.serviceFeePercent ?? 14)) /
        100
      ).toFixed(2),
    );
    const taxes = 0;
    const totalAmount = parseFloat(
      (discountedBase + cleaningFee + serviceFee + taxes).toFixed(2),
    );

    return {
      nights,
      pricePerNight,
      weekendPrice,
      baseAmount,
      discountPercent,
      discountAmount,
      discountedBase,
      cleaningFee,
      serviceFee,
      taxes,
      total: totalAmount,
      currency: property.currency,
      discountType,
      newListingPromotionActive: isNewListingPromoActive,
      lastMinuteDiscountActive: isLastMinute && lastMinutePct > 0,
    };
  }

  async getPricePreview(
    propertyId: number,
    checkIn: string,
    checkOut: string,
    guests: number,
  ): Promise<PriceBreakdown> {
    const property = await this.findOne(propertyId);
    return this.calculatePrice(property, checkIn, checkOut, guests);
  }

  async bulkAction(
    hostId: number,
    ids: number[],
    action: 'publish' | 'archive' | 'delete',
  ): Promise<{ succeeded: number[]; failed: number[] }> {
    const succeeded: number[] = [];
    const failed: number[] = [];

    for (const id of ids) {
      try {
        if (action === 'publish') {
          await this.publish(id, hostId);
        } else if (action === 'archive') {
          await this.archive(id, hostId);
        } else if (action === 'delete') {
          await this.permanentDelete(id, hostId);
        }
        succeeded.push(id);
      } catch {
        failed.push(id);
      }
    }

    return { succeeded, failed };
  }

  async bulkUpdatePricing(
    hostId: number,
    ids: number[],
    payload: Partial<Pick<PropertyEntity, 'pricePerNight' | 'weekendPrice' | 'weeklyDiscount' | 'monthlyDiscount' | 'lastMinuteDiscountPercent' | 'cleaningFee'>>,
  ): Promise<{ updated: number[]; failed: number[] }> {
    const updated: number[] = [];
    const failed: number[] = [];

    for (const id of ids) {
      try {
        const property = await this.findOne(id);
        if (property.hostId !== hostId) throw new ForbiddenException('You do not own this property');

        if (payload.weeklyDiscount != null && (payload.weeklyDiscount < 0 || payload.weeklyDiscount > 80)) {
          throw new BadRequestException('Weekly discount must be between 0 and 80');
        }
        if (payload.monthlyDiscount != null && (payload.monthlyDiscount < 0 || payload.monthlyDiscount > 80)) {
          throw new BadRequestException('Monthly discount must be between 0 and 80');
        }
        if (payload.lastMinuteDiscountPercent != null && (payload.lastMinuteDiscountPercent < 0 || payload.lastMinuteDiscountPercent > 80)) {
          throw new BadRequestException('Last-minute discount must be between 0 and 80');
        }

        Object.assign(property, payload);
        await this.propertiesRepo.save(property);
        updated.push(id);
      } catch {
        failed.push(id);
      }
    }

    return { updated, failed };
  }

  async bulkUpdateSettings(
    hostId: number,
    ids: number[],
    settings: Partial<Pick<PropertyEntity,
      | 'minNights'
      | 'maxNights'
      | 'instantBook'
      | 'bookingMode'
      | 'cancellationPolicy'
      | 'allowsPets'
      | 'allowsSmoking'
      | 'allowsParties'
      | 'allowsChildren'
      | 'checkInAfter'
      | 'checkOutBefore'
      | 'turnoverDays'
    >>,
  ): Promise<{ updated: number[]; failed: number[] }> {
    const updated: number[] = [];
    const failed: number[] = [];

    for (const id of ids) {
      try {
        const property = await this.findOne(id);
        if (property.hostId !== hostId) throw new ForbiddenException('You do not own this property');

        if (settings.minNights != null && settings.minNights < 1) {
          throw new BadRequestException('minNights must be at least 1');
        }
        if (settings.maxNights != null && settings.maxNights < 1) {
          throw new BadRequestException('maxNights must be at least 1');
        }
        if (
          settings.minNights != null && settings.maxNights != null
          && settings.maxNights < settings.minNights
        ) {
          throw new BadRequestException('maxNights must be greater than or equal to minNights');
        }
        if (
          settings.cancellationPolicy != null
          && !['flexible', 'moderate', 'strict'].includes(settings.cancellationPolicy)
        ) {
          throw new BadRequestException('Invalid cancellation policy');
        }
        if (
          settings.bookingMode != null
          && !['instant_book', 'approve_first_three'].includes(settings.bookingMode)
        ) {
          throw new BadRequestException('Invalid booking mode');
        }
        if (settings.turnoverDays != null && settings.turnoverDays < 0) {
          throw new BadRequestException('turnoverDays must be 0 or greater');
        }

        Object.assign(property, settings);
        await this.propertiesRepo.save(property);
        updated.push(id);
      } catch {
        failed.push(id);
      }
    }

    return { updated, failed };
  }

  async comparePerformance(hostId: number, ids?: number[]) {
    const where: any = { hostId };
    if (ids?.length) where.id = In(ids);

    const properties = await this.propertiesRepo.find({
      where,
      select: ['id', 'title', 'city', 'avgRating', 'reviewCount', 'viewCount', 'impressionCount'],
    });
    if (!properties.length) return [];

    const propertyIds = properties.map((p) => p.id);
    const bookings = await this.bookingsRepo.find({
      where: { propertyId: In(propertyIds) },
      select: ['propertyId', 'status', 'totalAmount', 'serviceFee', 'nights'],
    });

    const byId: Record<number, any> = Object.fromEntries(
      properties.map((p) => [p.id, {
        propertyId: p.id,
        title: p.title,
        city: p.city,
        avgRating: Number(p.avgRating ?? 0),
        reviewCount: Number(p.reviewCount ?? 0),
        views: Number(p.viewCount ?? 0),
        impressions: Number(p.impressionCount ?? 0),
        bookings: 0,
        completedBookings: 0,
        completionRate: 0,
        nights: 0,
        revenue: 0,
      }]),
    );

    for (const b of bookings) {
      const row = byId[b.propertyId];
      if (!row) continue;
      row.bookings += 1;
      row.nights += Number(b.nights ?? 0);
      if (b.status === 'completed') row.completedBookings += 1;
      if (b.status === 'completed' || b.status === 'confirmed') {
        row.revenue += Number(b.totalAmount ?? 0) - Number(b.serviceFee ?? 0);
      }
    }

    return Object.values(byId)
      .map((r: any) => ({
        ...r,
        completionRate: r.bookings > 0 ? Math.round((r.completedBookings / r.bookings) * 100) : 0,
      }))
      .sort((a: any, b: any) => b.revenue - a.revenue);
  }

  async getSmartPricingSuggestion(id: number, hostId: number) {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }

    const now = new Date();
    const horizon = 60;
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(end.getDate() + horizon);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const upcoming = await this.bookingsRepo.find({
      where: {
        propertyId: property.id,
        status: In(['pending', 'confirmed', 'in_progress'] as any),
      },
      select: ['checkIn', 'checkOut'],
    });

    const bookedNights = upcoming.reduce((sum, b) => {
      const inDate = new Date(b.checkIn);
      const outDate = new Date(b.checkOut);
      if (outDate < start || inDate > end) return sum;
      const overlapStart = inDate > start ? inDate : start;
      const overlapEnd = outDate < end ? outDate : end;
      const nights = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)));
      return sum + nights;
    }, 0);

    const occupancy = Math.min(100, Math.round((bookedNights / horizon) * 100));
    let suggestedMultiplier = 1;
    if (occupancy >= 80) suggestedMultiplier = 1.15;
    else if (occupancy >= 60) suggestedMultiplier = 1.08;
    else if (occupancy <= 20) suggestedMultiplier = 0.9;
    else if (occupancy <= 35) suggestedMultiplier = 0.96;

    const currentPrice = Number(property.pricePerNight ?? 0);
    const suggestedPrice = Math.max(1, Math.round(currentPrice * suggestedMultiplier));

    return {
      propertyId: property.id,
      horizonDays: horizon,
      occupancyPercent: occupancy,
      currentPrice,
      suggestedPrice,
      delta: suggestedPrice - currentPrice,
      recommendation:
        suggestedPrice > currentPrice
          ? 'High upcoming occupancy. Consider increasing nightly rate.'
          : suggestedPrice < currentPrice
          ? 'Lower upcoming occupancy. Consider a small rate reduction to improve conversion.'
          : 'Current rate looks balanced for upcoming demand.',
    };
  }
}
