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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a completed booking' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
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
