import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, IsNull } from 'typeorm';
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
import { isEgyptianPublicHoliday } from '../common/holidays.util';
import { localDateStr } from '../common/utils/date.util';
import { MailService, tplAdminPropertyPendingReview } from '../mail/mail.service';
import { PriceAlertsService } from '../price-alerts/price-alerts.service';

const ADMIN_NOTIFY_EMAIL = 'oikivo.support@gmail.com';

export interface NightlyRate {
  date: string;
  price: number;
}

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
  /** Per-night price breakdown array (one entry per night in the stay). */
  nightlyBreakdown: NightlyRate[];
}

// ─── Egyptian holidays: imported from common/holidays.util.ts ────────────────

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
    private mail: MailService,
    private priceAlertsService: PriceAlertsService,
  ) {}

  async create(hostId: number, dto: CreateListingDto): Promise<PropertyEntity> {
    const host = await this.usersRepo.findOne({ where: { id: hostId } });
    if (!host?.isEmailVerified) {
      throw new ForbiddenException('VERIFICATION_EMAIL_REQUIRED');
    }
    if (!host?.isPhoneVerified) {
      throw new ForbiddenException('VERIFICATION_PHONE_REQUIRED');
    }
    if (!host?.idVerificationStatus || host.idVerificationStatus === 'none') {
      throw new ForbiddenException('VERIFICATION_ID_REQUIRED');
    }

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

    if (!property || property.deletedAt) throw new NotFoundException('Property not found');
    return property;
  }

  /** Returns only the UUIDs from the input array that still exist in the DB. */
  async validateUuids(uuids: string[]): Promise<string[]> {
    if (!uuids.length) return [];
    const rows = await this.propertiesRepo.find({
      where: { uuid: In(uuids) },
      select: ['uuid'],
    });
    return rows.map((r) => r.uuid);
  }

  async findByUuid(uuid: string): Promise<PropertyEntity> {
    const property = await this.propertiesRepo.findOne({
      where: { uuid },
      relations: ['photos', 'amenities', 'host', 'houseRules', 'category'],
    });
    if (!property || property.deletedAt) throw new NotFoundException('Property not found');
    // Fire-and-forget view count increment (non-blocking)
    this.propertiesRepo.increment({ id: property.id }, 'viewCount', 1).catch(() => {});
    return property;
  }

  async update(id: number, hostId: number, dto: UpdateListingDto): Promise<PropertyEntity> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }

    const { amenityIds, wizardLastStep: incomingStep, ...updateData } = dto;

    // FIX P9: If property is published, validate that update doesn't break listing requirements
    const isLive = property.status === 'published' || property.status === 'pending_review';
    if (isLive) {
      // Block removing required fields on a live listing
      if (updateData.pricePerNight !== undefined && Number(updateData.pricePerNight) <= 0) {
        throw new BadRequestException('Cannot set price to 0 on a published listing. Unpublish first.');
      }
      if (updateData.title !== undefined && !updateData.title.trim()) {
        throw new BadRequestException('Cannot remove title from a published listing.');
      }
      if (updateData.description !== undefined && !updateData.description.trim()) {
        throw new BadRequestException('Cannot remove description from a published listing.');
      }
      if (updateData.maxGuests !== undefined && updateData.maxGuests < 1) {
        throw new BadRequestException('Cannot set guest capacity below 1 on a published listing.');
      }
      // Block reducing amenities below minimum on a live listing
      if (amenityIds !== undefined && amenityIds.length < 3) {
        throw new BadRequestException('Published listings require at least 3 amenities.');
      }
    }

    Object.assign(property, updateData);
    // Only advance wizardLastStep — never regress it (handles back-navigation in wizard)
    if (incomingStep !== undefined) {
      property.wizardLastStep = Math.max(property.wizardLastStep ?? 0, incomingStep);
    }
    await this.propertiesRepo.save(property);

    // If price changed, immediately check price alerts for this property
    if (updateData.pricePerNight !== undefined) {
      this.priceAlertsService
        .checkAlertsForProperty(id, Number(updateData.pricePerNight))
        .catch(() => {/* non-blocking */});
    }

    // FIX P9: After saving, re-check photo count for live listings
    if (isLive && amenityIds === undefined) {
      const photoCount = property.photos?.length ?? 0;
      if (photoCount < 5) {
        // Auto-unpublish if photos dropped below minimum
        property.status = 'draft' as any;
        property.isActive = false;
        await this.propertiesRepo.save(property);
      }
    }

    if (amenityIds !== undefined) {
      // Clear existing amenities and add new ones
      await this.dataSource.query(
        'DELETE FROM property_amenities WHERE property_id = ?',
        [id],
      );
      if (amenityIds.length > 0) {
        await this.addAmenities(id, amenityIds);
      }
      // Amenities changed — reload to include updated many-to-many
      return this.findOne(id);
    }

    // No amenity change — return already-loaded entity (skip second DB round-trip)
    return property;
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

    // Step-gating: wStep=0 means legacy listing → run all checks (backward compatible)
    const wStep = property.wizardLastStep ?? 0;
    const mustCheck = (minStep: number) => !wStep || wStep >= minStep;
    const notReachedMsg = 'Complete the listing wizard to enable this check.';

    const checks: { key: string; label: string; status: 'pass' | 'fail'; message?: string }[] = [
      {
        key: 'title',
        label: 'Listing title',
        status: !mustCheck(8) ? 'fail' :
          (property.title &&
           property.title.trim() !== 'Untitled listing' &&
           property.title.trim().length >= 3
            ? 'pass'
            : 'fail'),
        ...(!mustCheck(8)
          ? { message: notReachedMsg }
          : !(property.title && property.title.trim() !== 'Untitled listing' && property.title.trim().length >= 3)
          ? { message: 'Add a meaningful title for your listing.' }
          : {}),
      },
      {
        key: 'description',
        label: 'Description',
        status: !mustCheck(9) ? 'fail' : (property.description ? 'pass' : 'fail'),
        ...(!mustCheck(9)
          ? { message: notReachedMsg }
          : !property.description
          ? { message: 'Write a description for guests.' }
          : {}),
      },
      {
        key: 'location',
        label: 'Location details',
        status: !mustCheck(3) ? 'fail' : (property.city && property.country ? 'pass' : 'fail'),
        ...(!mustCheck(3)
          ? { message: notReachedMsg }
          : !(property.city && property.country)
          ? { message: 'Add your property city and country.' }
          : {}),
      },
      {
        key: 'map_location',
        label: 'Map pin',
        status: !mustCheck(3) ? 'fail' :
          (property.latitude != null && Number(property.latitude) !== 0 &&
           property.longitude != null && Number(property.longitude) !== 0
            ? 'pass'
            : 'fail'),
        ...(!mustCheck(3)
          ? { message: notReachedMsg }
          : !(property.latitude != null && Number(property.latitude) !== 0 &&
              property.longitude != null && Number(property.longitude) !== 0)
          ? { message: 'Set your property location on the map.' }
          : {}),
      },
      {
        key: 'pricing',
        label: 'Nightly price set',
        status: !mustCheck(12) ? 'fail' :
          (property.pricePerNight && Number(property.pricePerNight) > 0 ? 'pass' : 'fail'),
        ...(!mustCheck(12)
          ? { message: notReachedMsg }
          : !(property.pricePerNight && Number(property.pricePerNight) > 0)
          ? { message: 'Set a price per night.' }
          : {}),
      },
      {
        key: 'category',
        label: 'Property category',
        status: !mustCheck(5) ? 'fail' : (property.categoryId ? 'pass' : 'fail'),
        ...(!mustCheck(5)
          ? { message: notReachedMsg }
          : !property.categoryId
          ? { message: 'Choose a category for your property.' }
          : {}),
      },
      {
        key: 'capacity',
        label: 'Guest capacity',
        status: !mustCheck(4) ? 'fail' : (property.maxGuests >= 1 ? 'pass' : 'fail'),
        ...(!mustCheck(4)
          ? { message: notReachedMsg }
          : property.maxGuests < 1
          ? { message: 'Set maximum number of guests.' }
          : {}),
      },
      {
        key: 'photos',
        label: 'At least 5 photos',
        status: !mustCheck(7) ? 'fail' : (photoCount >= 5 ? 'pass' : 'fail'),
        ...(!mustCheck(7)
          ? { message: notReachedMsg }
          : photoCount < 5
          ? { message: `You have ${photoCount} photo${photoCount !== 1 ? 's' : ''}. Add at least ${5 - photoCount} more.` }
          : {}),
      },
      {
        key: 'cover_photo',
        label: 'Cover photo set',
        status: !mustCheck(7) ? 'fail' : (hasCover ? 'pass' : 'fail'),
        ...(!mustCheck(7)
          ? { message: notReachedMsg }
          : !hasCover
          ? { message: 'Mark one photo as the cover image.' }
          : {}),
      },
      {
        key: 'cancellation',
        label: 'Cancellation policy',
        status: !mustCheck(10) ? 'fail' : (property.cancellationPolicy ? 'pass' : 'fail'),
        ...(!mustCheck(10)
          ? { message: notReachedMsg }
          : !property.cancellationPolicy
          ? { message: 'Choose a cancellation policy.' }
          : {}),
      },
      {
        key: 'amenities',
        label: 'At least 3 amenities',
        status: !mustCheck(6) ? 'fail' : (amenitiesCount >= 3 ? 'pass' : 'fail'),
        ...(!mustCheck(6)
          ? { message: notReachedMsg }
          : amenitiesCount < 3
          ? { message: `Add at least ${3 - amenitiesCount} more amenit${3 - amenitiesCount === 1 ? 'y' : 'ies'}.` }
          : {}),
      },
      {
        key: 'house_rules',
        label: 'House rules configured',
        status: !mustCheck(10) ? 'fail' : (houseRulesCount > 0 ? 'pass' : 'fail'),
        ...(!mustCheck(10)
          ? { message: notReachedMsg }
          : houseRulesCount === 0
          ? { message: 'Add at least one house rule before publishing.' }
          : {}),
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

    // FIX P6: host_id verification is now a blocking check — consistent with publish() gate
    const infoChecks: { key: string; label: string; status: 'pass' | 'fail' | 'info'; message?: string }[] = [
      {
        key: 'host_id',
        label: 'Government ID verified',
        status: host?.idVerificationStatus === 'approved' ? 'pass' : 'fail',
        ...(host?.idVerificationStatus !== 'approved' && {
          message:
            host?.idVerificationStatus === 'pending'
              ? 'Your ID is under review — publishing will be available once approved.'
              : host?.idVerificationStatus === 'rejected'
              ? 'Your ID was rejected. Please re-upload to publish your listing.'
              : 'Government ID verification is required before publishing. Upload your ID in account settings.',
        }),
      },
      {
        key: 'weekend_price_warning',
        label: 'Weekend pricing sanity check',
        status: !mustCheck(13)
          ? 'info'
          : (property.weekendPrice == null ||
             Number(property.weekendPrice) >= Number(property.pricePerNight ?? 0)
              ? 'pass'
              : 'info'),
        ...(mustCheck(13) &&
          property.weekendPrice != null &&
          Number(property.weekendPrice) < Number(property.pricePerNight ?? 0) && {
          message: 'Weekend price is below base nightly price. This is allowed, but may reduce weekend earnings.',
        }),
      },
    ];

    const passCount = checks.filter((c) => c.status === 'pass').length;
    // FIX P6: infoChecks with status 'fail' also block publishing
    const infoFailCount = infoChecks.filter((c) => c.status === 'fail').length;

    return {
      propertyId: id,
      canPublish: passCount === checks.length && infoFailCount === 0,
      checks: [...checks, ...infoChecks],
      passCount,
      totalCount: checks.length + infoChecks.filter((c) => c.status !== 'info').length,
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
    // FIX P6: Removed separate idVerificationStatus check — now handled by verifyListing() below
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
    const saved = await this.propertiesRepo.save(property);

    // Notify admin that a new listing is pending review
    const adminPanelUrl = (process.env.ADMIN_URL ?? 'http://localhost:3003') + '/content-moderation';
    const hostDisplayName = host ? `${host.firstName} ${host.lastName}` : `Host #${hostId}`;
    const hostEmail = host?.email ?? '';
    this.mail.send(
      ADMIN_NOTIFY_EMAIL,
      'New Listing Submitted for Review',
      tplAdminPropertyPendingReview(property.title, hostDisplayName, hostEmail, adminPanelUrl),
    ).catch(() => {});

    return saved;
  }

  async archive(id: number, hostId: number): Promise<PropertyEntity> {
    const property = await this.findOne(id);
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You do not own this property');
    }

    const today = localDateStr(new Date());
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

    // FIX P7: Block transfer if property has active bookings
    const activeBookingCount = await this.bookingsRepo
      .createQueryBuilder('booking')
      .where('booking.propertyId = :propertyId', { propertyId: id })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['pending', 'confirmed', 'in_progress'],
      })
      .getCount();
    if (activeBookingCount > 0) {
      throw new BadRequestException(
        `Cannot transfer property with ${activeBookingCount} active booking(s). Cancel or complete all bookings first.`,
      );
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

  // FIX P8: permanentDelete requires archived status + zero active bookings + ownership
  async permanentDelete(id: number, hostId: number): Promise<{ message: string }> {
    const property = await this.propertiesRepo.findOne({
      where: { id },
      relations: ['photos'],
    });
    if (!property) throw new NotFoundException('Property not found');

    // Ownership check
    if (property.hostId !== hostId) {
      throw new ForbiddenException('You can only delete your own properties.');
    }

    // Verify property is archived
    if (property.status !== 'archived') {
      throw new BadRequestException('Property must be archived before permanent deletion.');
    }

    const activeBookingCount = await this.bookingsRepo
      .createQueryBuilder('booking')
      .where('booking.propertyId = :propertyId', { propertyId: id })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['pending', 'confirmed', 'in_progress'],
      })
      .getCount();
    if (activeBookingCount > 0) {
      throw new BadRequestException(
        `Cannot delete property with ${activeBookingCount} active booking(s).`,
      );
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

    // Soft-delete: mark deleted_at timestamp instead of hard-removing the row.
    // This preserves all FK-referenced booking, review, and payout records.
    property.deletedAt = new Date();
    await this.propertiesRepo.save(property);
    return { message: 'Property permanently deleted' };
  }

  async getArchivedListings(hostId: number): Promise<PropertyEntity[]> {
    return this.propertiesRepo.find({
      where: { hostId, status: 'archived' as any, deletedAt: IsNull() },
      relations: ['photos', 'category'],
      order: { archivedAt: 'DESC' },
    });
  }

  async getHostListings(hostId: number, page = 1, limit = 200) {
    const [items, total] = await this.propertiesRepo.findAndCount({
      where: { hostId, deletedAt: IsNull() },
      relations: ['photos', 'category', 'amenities', 'host'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async addAmenities(propertyId: number, amenityIds: number[]): Promise<void> {
    // FIX P10: Guard against empty array — would produce invalid SQL
    if (!amenityIds || amenityIds.length === 0) return;

    const amenities = await this.amenitiesRepo.find({
      where: { id: In(amenityIds) },
    });

    if (amenities.length === 0) return;

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

    if (!rules.length) return [];

    // Use raw INSERT to avoid TypeORM nullifying property_id via the undefined
    // `property` relation object when calling .save() on a new entity.
    await this.dataSource.query(
      `INSERT INTO property_house_rules (property_id, rule, rule_ar) VALUES ${rules.map(() => '(?,?,?)').join(', ')}`,
      rules.flatMap((r) => [propertyId, r.rule, r.ruleAr ?? null]),
    );

    return this.houseRulesRepo.find({ where: { propertyId } });
  }

  /** Sum per-night prices accounting for weekend pricing */
  private buildNightlyBreakdown(
    property: PropertyEntity,
    checkIn: string,
    checkOut: string,
    priceOverrides: Map<string, number> = new Map(),
  ): { amount: number; breakdown: NightlyRate[] } {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const basePrice = Number(property.pricePerNight ?? 0);
    const weekendPrice =
      property.weekendPrice != null ? Number(property.weekendPrice) : null;

    let amount = 0;
    const breakdown: NightlyRate[] = [];
    for (
      let d = new Date(checkInDate);
      d < checkOutDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = localDateStr(d);
      const override = priceOverrides.get(dateStr);
      let nightPrice: number;
      if (override != null) {
        nightPrice = override;
      } else {
        const dow = d.getDay(); // 5=Friday, 6=Saturday
        const isPeak = dow === 5 || dow === 6 || isEgyptianPublicHoliday(d);
        nightPrice = isPeak && weekendPrice != null ? weekendPrice : basePrice;
      }
      amount += nightPrice;
      breakdown.push({ date: dateStr, price: nightPrice });
    }
    return { amount: parseFloat(amount.toFixed(2)), breakdown };
  }

  private calculateNightlyBase(
    property: PropertyEntity,
    checkIn: string,
    checkOut: string,
    priceOverrides: Map<string, number> = new Map(),
  ): number {
    return this.buildNightlyBreakdown(property, checkIn, checkOut, priceOverrides).amount;
  }

  calculatePrice(
    property: PropertyEntity,
    checkIn: string,
    checkOut: string,
    guests: number,
    priceOverrides: Map<string, number> = new Map(),
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
    const { amount: baseAmount, breakdown: nightlyBreakdown } = this.buildNightlyBreakdown(property, checkIn, checkOut, priceOverrides);

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
        ((discountedBase + cleaningFee) * Number(property.serviceFeePercent ?? 5)) /
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
      nightlyBreakdown,
    };
  }

  async getPricePreview(
    propertyId: number,
    checkIn: string,
    checkOut: string,
    guests: number,
  ): Promise<PriceBreakdown> {
    const property = await this.findOne(propertyId);

    // Load per-date price overrides for the booking window
    const rows: { date: string; price_override: string | null }[] = await this.dataSource.query(
      `SELECT date, price_override FROM property_availability
       WHERE property_id = ? AND date >= ? AND date < ? AND price_override IS NOT NULL`,
      [propertyId, checkIn, checkOut],
    );
    const priceOverrides = new Map<string, number>(
      rows.map((r) => {
        // MySQL2 returns DATE columns as JS Date objects (not YYYY-MM-DD strings),
        // so we must normalise through localDateStr to match the keys used in buildNightlyBreakdown.
        const dateKey =
          typeof r.date === 'string' && r.date.length === 10
            ? r.date
            : localDateStr(new Date(r.date as unknown as string | Date));
        return [dateKey, Number(r.price_override)];
      }),
    );

    return this.calculatePrice(property, checkIn, checkOut, guests, priceOverrides);
  }

  async bulkCheckBookings(
    hostId: number,
    ids: number[],
  ): Promise<{ id: number; title: string; bookingCount: number }[]> {
    const result: { id: number; title: string; bookingCount: number }[] = [];
    for (const id of ids) {
      const prop = await this.propertiesRepo.findOne({ where: { id, hostId } });
      if (!prop) continue;
      const bookingCount = await this.bookingsRepo
        .createQueryBuilder('booking')
        .where('booking.propertyId = :propertyId', { propertyId: id })
        .andWhere('booking.status IN (:...statuses)', {
          statuses: ['pending', 'confirmed', 'in_progress'],
        })
        .getCount();
      if (bookingCount > 0) {
        result.push({ id, title: prop.title, bookingCount });
      }
    }
    return result;
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
          // Check for active bookings before attempting deletion
          const activeBookingCount = await this.bookingsRepo
            .createQueryBuilder('booking')
            .where('booking.propertyId = :propertyId', { propertyId: id })
            .andWhere('booking.status IN (:...statuses)', {
              statuses: ['pending', 'confirmed', 'in_progress'],
            })
            .getCount();
          if (activeBookingCount > 0) {
            throw new BadRequestException(
              `Cannot delete: property has ${activeBookingCount} active booking(s).`,
            );
          }
          // Soft-archive first if not already archived (permanentDelete requires archived status)
          const prop = await this.findOne(id);
          if (prop.hostId !== hostId) throw new ForbiddenException('You do not own this property');
          if (prop.status !== 'archived') {
            await this.delete(id, hostId);
          }
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
        // Immediately check price alerts if price changed
        if (payload.pricePerNight !== undefined) {
          this.priceAlertsService
            .checkAlertsForProperty(id, Number(payload.pricePerNight))
            .catch(() => {/* non-blocking */});
        }
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
          && !['instant_book', 'approve_first_three', 'always_approve'].includes(settings.bookingMode)
        ) {
          throw new BadRequestException('Invalid booking mode');
        }
        if (settings.turnoverDays != null && settings.turnoverDays < 0) {
          throw new BadRequestException('turnoverDays must be 0 or greater');
        }

        Object.assign(property, settings);
        // Keep the instantBook column in sync with bookingMode
        if (settings.bookingMode === 'instant_book') property.instantBook = true;
        else if (settings.bookingMode === 'approve_first_three' || settings.bookingMode === 'always_approve') property.instantBook = false;
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
    const startStr = localDateStr(start);
    const endStr = localDateStr(end);

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
