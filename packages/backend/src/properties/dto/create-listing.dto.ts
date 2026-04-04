import {
  IsString, IsOptional, IsNumber, IsBoolean, IsIn, IsArray,
  IsPositive, Min, Max, IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @ApiProperty({ example: 'Cozy Studio in Riyadh' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'A beautiful place to stay...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    enum: ['entire_place', 'private_room', 'shared_room'],
    default: 'entire_place',
  })
  @IsOptional()
  @IsIn(['entire_place', 'private_room', 'shared_room'])
  spaceType?: string;

  @ApiProperty({ example: 'apartment' })
  @IsOptional()
  @IsString()
  propertyKind?: string;

  @ApiProperty({ example: 250.00, minimum: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(1)
  pricePerNight?: number;

  @ApiProperty({ example: 300.00, required: false, description: 'Price for Friday & Saturday nights' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weekendPrice?: number;

  @ApiProperty({ example: 10, required: false, description: 'Discount % for stays of 7+ nights' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(90)
  weeklyDiscount?: number;

  @ApiProperty({ example: 20, required: false, description: 'Discount % for stays of 28+ nights' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(90)
  monthlyDiscount?: number;

  @ApiProperty({ required: false, default: false, description: '20% off for the first 3 bookings (new listing promotion)' })
  @IsOptional()
  @IsBoolean()
  newListingPromotionEnabled?: boolean;

  @ApiProperty({ example: 10, required: false, description: 'Discount % for bookings made 14 days or less before arrival' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(90)
  lastMinuteDiscountPercent?: number;

  @ApiProperty({
    enum: ['instant_book', 'approve_first_three'],
    default: 'instant_book',
    required: false,
    description: 'instant_book = guests book immediately; approve_first_three = host approves first 3 then switches to instant book',
  })
  @IsOptional()
  @IsIn(['instant_book', 'approve_first_three'])
  bookingMode?: string;

  @ApiProperty({ example: 'EGP', default: 'EGP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 50.00, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cleaningFee?: number;

  @ApiProperty({ example: 500, default: 0, description: 'Refundable security deposit held during the stay (EGP). 0 = no deposit.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50000)
  securityDeposit?: number;

  @ApiProperty({ example: 14.00, default: 14.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  serviceFeePercent?: number;

  @ApiProperty({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  minNights?: number;

  @ApiProperty({ example: 30, default: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  maxNights?: number;

  @ApiProperty({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  maxGuests?: number;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiProperty({ example: 1.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  beds?: number;

  @ApiProperty({ required: false, example: '123 King Fahd Road' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: 'Riyadh' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, example: 'Riyadh Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false, example: 'Saudi Arabia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, example: 'SA' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ required: false, example: '12345' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ required: false, example: 24.7136 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false, example: 46.6753 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false, example: '15:00:00' })
  @IsOptional()
  @IsString()
  checkInAfter?: string;

  @ApiProperty({ required: false, example: '11:00:00' })
  @IsOptional()
  @IsString()
  checkOutBefore?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  allowsPets?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  allowsSmoking?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  allowsParties?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  allowsChildren?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  instantBook?: boolean;

  @ApiProperty({
    required: false,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'flexible',
    description: 'Cancellation policy for this listing',
  })
  @IsOptional()
  @IsIn(['flexible', 'moderate', 'strict'])
  cancellationPolicy?: string;

  @ApiProperty({ required: false, type: [Number], description: 'Amenity IDs' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  amenityIds?: number[];
}
