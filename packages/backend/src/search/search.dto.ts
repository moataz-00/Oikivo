import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class SearchDto {
  @ApiProperty({ required: false, example: 'Riyadh' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, example: 'Saudi Arabia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, example: '2026-04-10' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiProperty({ required: false, example: '2026-04-15' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  guests?: number;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false, example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ required: false, example: 1, description: 'Category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiProperty({ required: false, enum: ['entire_place', 'private_room', 'shared_room'] })
  @IsOptional()
  @IsIn(['entire_place', 'private_room', 'shared_room'])
  spaceType?: string;

  @ApiProperty({ required: false, example: 'apartment' })
  @IsOptional()
  @IsString()
  propertyKind?: string;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  instantBook?: boolean;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  allowsPets?: boolean;

  @ApiProperty({ required: false, type: [Number], description: 'Required amenity IDs' })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value.map(Number) : [Number(value)]))
  @IsArray()
  amenityIds?: number[];

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBedrooms?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBeds?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBathrooms?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ required: false, enum: ['price_asc', 'price_desc', 'rating', 'newest'], default: 'rating' })
  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'rating', 'newest'])
  sortBy?: string;
}
