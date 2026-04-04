import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ExperiencesService } from './experiences.service';
import { ExperienceBookingsService } from './experience-bookings.service';
import { ExperienceReviewsService } from './experience-reviews.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { CreateExperienceBookingDto } from './dto/create-experience-booking.dto';
import { CreateExperienceReviewDto } from './dto/create-experience-review.dto';
import { ReplyExperienceReviewDto } from './dto/reply-experience-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

// ─── Experiences CRUD ───────────────────────────────────────────

@ApiTags('experiences')
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all experience categories' })
  getCategories() {
    return this.experiencesService.getCategories();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search experiences' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'guests', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'instantBook', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  search(
    @Query('city') city?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('guests') guests?: string,
    @Query('language') language?: string,
    @Query('date') date?: string,
    @Query('instantBook') instantBook?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.experiencesService.search({
      city,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      guests: guests ? parseInt(guests) : undefined,
      language,
      date,
      instantBook: instantBook !== undefined ? instantBook === 'true' : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
  }

  @Get('host/listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all experiences for the current host' })
  getHostExperiences(@CurrentUser() user: UserEntity) {
    return this.experiencesService.getHostExperiences(user.id);
  }

  @Get(':id/price-preview')
  @ApiOperation({ summary: 'Get price preview for an experience' })
  @ApiQuery({ name: 'guests', required: true, example: 3 })
  getPricePreview(
    @Param('id', ParseIntPipe) id: number,
    @Query('guests') guests: string,
  ) {
    return this.experiencesService.getPricePreview(id, parseInt(guests) || 1);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experience by ID or UUID' })
  findOne(@Param('id') id: string) {
    if (id.includes('-')) {
      return this.experiencesService.findByUuid(id);
    }
    return this.experiencesService.findOne(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new experience' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateExperienceDto) {
    if (!user.isHost) throw new ForbiddenException('You must be a host to create experiences');
    return this.experiencesService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an experience' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.experiencesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive an experience' })
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.experiencesService.delete(id, user.id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft experience' })
  publish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.experiencesService.publish(id, user.id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive an experience' })
  archive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.experiencesService.archive(id, user.id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore an archived experience' })
  restore(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.experiencesService.restore(id, user.id);
  }
}

// ─── Experience Bookings ────────────────────────────────────────

@ApiTags('experience-bookings')
@Controller('experience-bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExperienceBookingsController {
  constructor(private readonly bookingsService: ExperienceBookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Book an experience' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateExperienceBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('my-trips')
  @ApiOperation({ summary: 'Get all experience bookings for the current guest' })
  @ApiQuery({ name: 'status', required: false })
  getMyTrips(@CurrentUser() user: UserEntity, @Query('status') status?: string) {
    return this.bookingsService.getGuestBookings(user.id, status);
  }

  @Get('host/reservations')
  @ApiOperation({ summary: 'Get all experience reservations for the current host' })
  @ApiQuery({ name: 'status', required: false })
  getHostReservations(@CurrentUser() user: UserEntity, @Query('status') status?: string) {
    return this.bookingsService.getHostBookings(user.id, status);
  }

  @Get('host/analytics')
  @ApiOperation({ summary: 'Get analytics for the current host experience bookings' })
  getHostAnalytics(@CurrentUser() user: UserEntity) {
    return this.bookingsService.getHostAnalytics(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experience booking details' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    const booking = await this.bookingsService.findOne(id);
    if (booking.guestId !== user.id && booking.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Not authorized to view this booking');
    }
    return booking;
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm an experience booking (host only)' })
  confirm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.bookingsService.confirm(id, user.id);
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Decline an experience booking (host only)' })
  decline(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.decline(id, user.id, body.reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an experience booking' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancel(id, user.id, body.reason);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark experience booking as completed (host only)' })
  complete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.bookingsService.complete(id, user.id);
  }

  @Patch(':id/submit-payment')
  @ApiOperation({ summary: 'Submit payment reference (guest)' })
  submitPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { method: string; reference: string; proofUrl?: string },
  ) {
    return this.bookingsService.submitPayment(id, user.id, body);
  }

  @Patch(':id/confirm-payment')
  @ApiOperation({ summary: 'Confirm payment received (admin only)' })
  confirmPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.bookingsService.confirmPayment(id);
  }
}

// ─── Experience Reviews ─────────────────────────────────────────

@ApiTags('experience-reviews')
@Controller('experience-reviews')
export class ExperienceReviewsController {
  constructor(private readonly reviewsService: ExperienceReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a completed experience booking' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateExperienceReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to an experience review (host only)' })
  reply(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: ReplyExperienceReviewDto,
  ) {
    return this.reviewsService.replyToReview(id, user.id, dto);
  }

  @Get('experience/:experienceId')
  @ApiOperation({ summary: 'Get reviews for an experience' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getExperienceReviews(
    @Param('experienceId', ParseIntPipe) experienceId: number,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.reviewsService.getExperienceReviews(
      experienceId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
  }

  @Get('experience/:experienceId/stats')
  @ApiOperation({ summary: 'Get review statistics for an experience' })
  getReviewStats(@Param('experienceId', ParseIntPipe) experienceId: number) {
    return this.reviewsService.getReviewStats(experienceId);
  }
}
