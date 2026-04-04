import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExperienceReviewEntity } from '../entities/experience-review.entity';
import { ExperienceBookingEntity } from '../entities/experience-booking.entity';
import { ExperienceEntity } from '../entities/experience.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateExperienceReviewDto } from './dto/create-experience-review.dto';
import { ReplyExperienceReviewDto } from './dto/reply-experience-review.dto';

@Injectable()
export class ExperienceReviewsService {
  constructor(
    @InjectRepository(ExperienceReviewEntity)
    private reviewsRepo: Repository<ExperienceReviewEntity>,
    @InjectRepository(ExperienceBookingEntity)
    private bookingsRepo: Repository<ExperienceBookingEntity>,
    @InjectRepository(ExperienceEntity)
    private experiencesRepo: Repository<ExperienceEntity>,
    private notificationsService: NotificationsService,
  ) {}

  async create(reviewerId: number, dto: CreateExperienceReviewDto): Promise<ExperienceReviewEntity> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['experience'],
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
      experienceId: booking.experienceId,
      overallRating: dto.overallRating,
      hostRating: dto.hostRating,
      valueRating: dto.valueRating,
      activityRating: dto.activityRating,
      comment: dto.comment,
    });

    const saved = await this.reviewsRepo.save(review);

    // Update experience avg_rating and review_count
    await this.updateExperienceRating(booking.experienceId);

    // Notify host
    await this.notificationsService.create(
      booking.hostId,
      'experience_review',
      'New Experience Review',
      'تقييم تجربة جديد',
      `You received a new ${dto.overallRating}-star review for "${booking.experience.title}"`,
      `لقد حصلت على تقييم جديد ${dto.overallRating} نجوم لتجربة "${booking.experience.title}"`,
      { reviewId: saved.id, experienceId: booking.experienceId },
    );

    return saved;
  }

  async replyToReview(
    reviewId: number,
    hostId: number,
    dto: ReplyExperienceReviewDto,
  ): Promise<ExperienceReviewEntity> {
    const review = await this.reviewsRepo.findOne({
      where: { id: reviewId },
      relations: ['experience'],
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.experience.hostId !== hostId) {
      throw new ForbiddenException('You can only reply to reviews for your experiences');
    }
    if (review.hostReply) {
      throw new BadRequestException('You have already replied to this review');
    }

    review.hostReply = dto.hostReply;
    review.hostRepliedAt = new Date();
    return this.reviewsRepo.save(review);
  }

  async getExperienceReviews(experienceId: number, page = 1, limit = 10) {
    const [items, total] = await this.reviewsRepo.findAndCount({
      where: { experienceId },
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

  async getReviewStats(experienceId: number) {
    const result = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.overallRating)', 'avgOverall')
      .addSelect('AVG(review.hostRating)', 'avgHost')
      .addSelect('AVG(review.valueRating)', 'avgValue')
      .addSelect('AVG(review.activityRating)', 'avgActivity')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.experienceId = :experienceId', { experienceId })
      .getRawOne();

    return {
      avgOverall: parseFloat(result.avgOverall) || 0,
      avgHost: parseFloat(result.avgHost) || 0,
      avgValue: parseFloat(result.avgValue) || 0,
      avgActivity: parseFloat(result.avgActivity) || 0,
      totalReviews: parseInt(result.totalReviews) || 0,
    };
  }

  private async updateExperienceRating(experienceId: number) {
    const stats = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.overallRating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.experienceId = :experienceId', { experienceId })
      .getRawOne();

    await this.experiencesRepo.update(experienceId, {
      avgRating: parseFloat(parseFloat(stats.avg).toFixed(2)) || 0,
      reviewCount: parseInt(stats.count) || 0,
    });
  }
}
