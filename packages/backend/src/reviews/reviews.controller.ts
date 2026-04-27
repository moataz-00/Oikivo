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
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

const reviewPhotoStorage = diskStorage({
  destination: (req, file, cb) => {
    const reviewId = req.params.id;
    const dir = join(process.cwd(), 'uploads', 'reviews', reviewId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `photo-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const imageFilter = (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 86400000, limit: 5 } })
  @ApiOperation({ summary: 'Create a review for a completed booking' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a review within 48 hours of submission (G1)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(id, user.id, dto);
  }

  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a review (host only)' })
  reply(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.replyToReview(id, user.id, dto);
  }

  @Get('host/pending-guest-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get completed bookings awaiting a host→guest review' })
  getPendingGuestReviews(@CurrentUser() user: UserEntity) {
    return this.reviewsService.getBookingsAwaitingHostReview(user.id);
  }

  @Get('host/guest-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all host→guest reviews written by the current host' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getHostGuestReviews(
    @CurrentUser() user: UserEntity,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.reviewsService.getHostGuestReviews(
      user.id,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get reviews for a property' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getPropertyReviews(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.reviewsService.getPropertyReviews(
      propertyId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
  }

  @Get('property/:propertyId/stats')
  @ApiOperation({ summary: 'Get review statistics for a property' })
  getReviewStats(@Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.reviewsService.getReviewStats(propertyId);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload photos to a review (reviewer only, up to 5 photos)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: reviewPhotoStorage,
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per photo
    }),
  )
  async uploadPhotos(
    @Param('id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const photoPaths = files.map((f) => `/uploads/reviews/${reviewId}/${f.filename}`);
    return this.reviewsService.addPhotos(reviewId, user.id, photoPaths);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review (reviewer, host, or admin)' })
  async deleteReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    await this.reviewsService.deleteReview(id, user.id, user.isAdmin);
  }
}
