import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsInt,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExperienceReviewDto {
  @ApiProperty({ example: 1, description: 'Experience Booking ID' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  bookingId: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @ApiProperty({ required: false, example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  hostRating?: number;

  @ApiProperty({ required: false, example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  valueRating?: number;

  @ApiProperty({ required: false, example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  activityRating?: number;

  @ApiProperty({ required: false, example: 'Amazing food tour, highly recommend!' })
  @IsOptional()
  @IsString()
  comment?: string;
}
