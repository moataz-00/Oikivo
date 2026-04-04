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
    await this.reviewsRepo.remove(review);
    await this.updatePropertyRating(propertyId);
  }

  private async updatePropertyRating(propertyId: number) {
    const stats = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.overallRating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.propertyId = :propertyId', { propertyId })
      .getRawOne();

    await this.propertiesRepo.update(propertyId, {
      avgRating: parseFloat(parseFloat(stats.avg).toFixed(2)) || 0,
      reviewCount: parseInt(stats.count) || 0,
    });
  }
}
