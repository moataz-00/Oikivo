import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  Max,
  IsInt,
  IsPositive,
  MaxLength,
  ArrayMaxSize,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ example: 1, description: 'Booking ID being reviewed' })
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
  cleanlinessRating?: number;

  @ApiProperty({ required: false, example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  accuracyRating?: number;

  @ApiProperty({ required: false, example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @ApiProperty({ required: false, example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  locationRating?: number;

  @ApiProperty({ required: false, example: 5, minimum: 1, maximum: 5 })
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
  checkinRating?: number;

  @ApiProperty({ required: false, example: 'Amazing stay! Highly recommended.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comment?: string;

  /** G4: URLs of photos uploaded by the reviewer */
  @ApiProperty({ required: false, type: [String], example: ['https://cdn.example.com/review1.jpg'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Reviews can have a maximum of 5 photos' })
  @IsUrl({}, { each: true })
  @Matches(/\.(jpg|jpeg|png|webp)([?#].*)?$/i, { each: true, message: 'Only jpg, jpeg, png, and webp image URLs are allowed' })
  photos?: string[];

  /** 'guest' (default) = guest reviews property; 'host' = host reviews guest */
  @ApiProperty({ required: false, enum: ['guest', 'host'], default: 'guest' })
  @IsOptional()
  @IsEnum(['guest', 'host'])
  reviewerRole?: 'guest' | 'host';
}
