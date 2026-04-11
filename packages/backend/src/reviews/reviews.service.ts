import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../entities/review.entity';
import { BookingEntity } from '../entities/booking.entity';
import { PropertyEntity } from '../entities/property.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private reviewsRepo: Repository<ReviewEntity>,
    @InjectRepository(BookingEntity)
    private bookingsRepo: Repository<BookingEntity>,
    @InjectRepository(PropertyEntity)
    private propertiesRepo: Repository<PropertyEntity>,
    private notificationsService: NotificationsService,
  ) {}

  async create(reviewerId: number, dto: CreateReviewDto): Promise<ReviewEntity> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['property'],
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.guestId !== reviewerId) {
      throw new ForbiddenException('You can only review your own bookings');
    }
    if (booking.status !== 'completed') {
      throw new BadRequestException('You can only review completed bookings');
    }

    // G2: Enforce 14-day review window after checkout
    const checkOutDate = new Date(booking.checkOut);
    const reviewDeadline = new Date(checkOutDate);
    reviewDeadline.setDate(reviewDeadline.getDate() + 14);
    if (new Date() > reviewDeadline) {
      throw new BadRequestException(
        'The review window has closed. Reviews must be submitted within 14 days of checkout.',
      );
    }

    const existing = await this.reviewsRepo.findOne({
      where: { bookingId: dto.bookingId },
    });
    if (existing) throw new ConflictException('You have already reviewed this booking');

    const review = this.reviewsRepo.create({
      bookingId: dto.bookingId,
      reviewerId,
      propertyId: booking.propertyId,
      overallRating: dto.overallRating,
      cleanlinessRating: dto.cleanlinessRating,
      accuracyRating: dto.accuracyRating,
      communicationRating: dto.communicationRating,
      locationRating: dto.locationRating,
      valueRating: dto.valueRating,
      checkinRating: dto.checkinRating,
      comment: dto.comment,
      photos: dto.photos ?? null,
    });

    const saved = await this.reviewsRepo.save(review);

    // Update property avg_rating and review_count
    await this.updatePropertyRating(booking.propertyId);

    // Notify host
    await this.notificationsService.create(
      booking.property.hostId,
      'new_review',
      'New Review Received',
      'تقييم جديد',
      `You received a new ${dto.overallRating}-star review`,
      `لقد حصلت على تقييم جديد ${dto.overallRating} نجوم`,
      { reviewId: saved.id, propertyId: booking.propertyId },
    );

    return saved;
  }

  async replyToReview(reviewId: number, hostId: number, dto: ReplyReviewDto): Promise<ReviewEntity> {
    const review = await this.reviewsRepo.findOne({
      where: { id: reviewId },
      relations: ['property'],
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.property.hostId !== hostId) {
      throw new ForbiddenException('You can only reply to reviews for your properties');
    }
    if (review.hostReply) {
      throw new BadRequestException('You have already replied to this review');
    }

    review.hostReply = dto.hostReply;
    review.hostRepliedAt = new Date();
    return this.reviewsRepo.save(review);
  }

  /** G1: Allow guest to edit their review within 48 hours of submission */
  async updateReview(reviewId: number, reviewerId: number, dto: UpdateReviewDto): Promise<ReviewEntity> {
    const review = await this.reviewsRepo.findOne({
      where: { id: reviewId },
      relations: ['property'],
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    // Enforce 48-hour edit window
    const editDeadline = new Date(review.createdAt);
    editDeadline.setHours(editDeadline.getHours() + 48);
    if (new Date() > editDeadline) {
      throw new BadRequestException(
        'The edit window has closed. Reviews can only be edited within 48 hours of submission.',
      );
    }

    // Apply partial updates
    if (dto.overallRating !== undefined) review.overallRating = dto.overallRating;
    if (dto.cleanlinessRating !== undefined) review.cleanlinessRating = dto.cleanlinessRating;
    if (dto.accuracyRating !== undefined) review.accuracyRating = dto.accuracyRating;
    if (dto.communicationRating !== undefined) review.communicationRating = dto.communicationRating;
    if (dto.locationRating !== undefined) review.locationRating = dto.locationRating;
    if (dto.valueRating !== undefined) review.valueRating = dto.valueRating;
    if (dto.checkinRating !== undefined) review.checkinRating = dto.checkinRating;
    if (dto.comment !== undefined) review.comment = dto.comment;

    const saved = await this.reviewsRepo.save(review);

    // Recalculate property avg rating after edit
    await this.updatePropertyRating(review.propertyId);

    return saved;
  }

  async getPropertyReviews(propertyId: number, page = 1, limit = 10) {
    const [items, total] = await this.reviewsRepo.findAndCount({
      where: { propertyId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReviewStats(propertyId: number) {
    const result = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.overallRating)', 'avgOverall')
      .addSelect('AVG(review.cleanlinessRating)', 'avgCleanliness')
      .addSelect('AVG(review.accuracyRating)', 'avgAccuracy')
      .addSelect('AVG(review.communicationRating)', 'avgCommunication')
      .addSelect('AVG(review.locationRating)', 'avgLocation')
      .addSelect('AVG(review.valueRating)', 'avgValue')
      .addSelect('AVG(review.checkinRating)', 'avgCheckin')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.propertyId = :propertyId', { propertyId })
      .getRawOne();

    return {
      avgOverall: parseFloat(result.avgOverall) || 0,
      avgCleanliness: parseFloat(result.avgCleanliness) || 0,
      avgAccuracy: parseFloat(result.avgAccuracy) || 0,
      avgCommunication: parseFloat(result.avgCommunication) || 0,
      avgLocation: parseFloat(result.avgLocation) || 0,
      avgValue: parseFloat(result.avgValue) || 0,
      avgCheckin: parseFloat(result.avgCheckin) || 0,
      totalReviews: parseInt(result.totalReviews) || 0,
    };
  }

  async getUserReviews(userId: number) {
    return this.reviewsRepo
      .createQueryBuilder('review')
      .innerJoin('review.property', 'property', 'property.hostId = :userId', { userId })
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.property', 'reviewProperty')
      .orderBy('review.createdAt', 'DESC')
      .getMany();
  }
  // REV-G2: Add photos to a review (reviewer only, max 5 photos)
  async addPhotos(reviewId: number, reviewerId: number, photoPaths: string[]): Promise<ReviewEntity> {
    const review = await this.reviewsRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('You can only add photos to your own reviews');
    }

    // Merge with existing photos (if any)
    const existingPhotos = review.photos || [];
    const allPhotos = [...existingPhotos, ...photoPaths];

    // Enforce max 5 photos
    if (allPhotos.length > 5) {
      throw new BadRequestException('Reviews can have a maximum of 5 photos');
    }

    await this.reviewsRepo.update(reviewId, {
      photos: allPhotos,
    });

    return this.reviewsRepo.findOne({ where: { id: reviewId }, relations: ['reviewer', 'property'] });
  }
  // G21: Delete a review and recalculate the property’s avg rating
  async deleteReview(reviewId: number, requesterId: number, isAdmin: boolean): Promise<void> {
    const review = await this.reviewsRepo.findOne({
      where: { id: reviewId },
      relations: ['property'],
    });
    if (!review) throw new NotFoundException('Review not found');

    if (
      !isAdmin &&
      review.reviewerId !== requesterId &&
      review.property?.hostId !== requesterId
    ) {
      throw new ForbiddenException('Not authorized to delete this review');
    }

    const { propertyId } = review;
    
    // Soft delete instead of hard delete
    const deletedBy = isAdmin ? 'admin' : (review.reviewerId === requesterId ? 'guest' : 'host');
    await this.reviewsRepo.update(reviewId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy as any,
    });
    
    // Recalculate property rating excluding soft-deleted reviews
    await this.updatePropertyRating(propertyId);
  }

  private async updatePropertyRating(propertyId: number) {
    let stats: { avg: string | null; count: string | null };
    try {
      stats = await this.reviewsRepo
        .createQueryBuilder('review')
        .select('AVG(review.overallRating)', 'avg')
        .addSelect('COUNT(review.id)', 'count')
        .where('review.propertyId = :propertyId', { propertyId })
        .andWhere('review.isDeleted = :isDeleted', { isDeleted: false }) // Exclude deleted reviews when available
        .getRawOne();
    } catch {
      // Backward compatibility for DBs where soft-delete columns are not migrated yet.
      stats = await this.reviewsRepo
        .createQueryBuilder('review')
        .select('AVG(review.overallRating)', 'avg')
        .addSelect('COUNT(review.id)', 'count')
        .where('review.propertyId = :propertyId', { propertyId })
        .getRawOne();
    }

    await this.propertiesRepo.update(propertyId, {
      avgRating: parseFloat(parseFloat(stats.avg).toFixed(2)) || 0,
      reviewCount: parseInt(stats.count) || 0,
    });
  }
}
