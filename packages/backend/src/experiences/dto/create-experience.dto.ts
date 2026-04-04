import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsPositive,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ItineraryStepDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  stepNumber: number;

  @ApiProperty({ example: 'Meet at the spice market' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'We will explore traditional spices...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationMinutes?: number;
}

export class ScheduleSlotDto {
  @ApiProperty({ example: 1, description: '0=Sunday, 1=Monday, ..., 6=Saturday' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '10:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ required: false, example: '14:00' })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class CreateExperienceDto {
  @ApiProperty({ example: 'Cairo Street Food Tour' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'Discover the best street food in Cairo...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Experience Category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiProperty({ required: false, example: 'We will visit 5 iconic street food stalls...' })
  @IsOptional()
  @IsString()
  whatWellDo?: string;

  @ApiProperty({ required: false, example: 'All food tastings, water, and snacks' })
  @IsOptional()
  @IsString()
  whatIWillProvide?: string;

  @ApiProperty({ required: false, example: 'Comfortable walking shoes required' })
  @IsOptional()
  @IsString()
  guestRequirements?: string;

  @ApiProperty({ example: 'English', default: 'English' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ example: 180, description: 'Duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  durationMinutes?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  maxGuests?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minGuests?: number;

  @ApiProperty({ example: 250.0 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pricePerPerson: number;

  @ApiProperty({ required: false, example: 10, description: 'Discount % for 5+ guests' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  groupDiscountPercent?: number;

  @ApiProperty({ example: 'Cairo' })
  @IsString()
  city: string;

  @ApiProperty({ required: false, example: 'Khan El Khalili, Islamic Cairo' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: 'Egypt', default: 'Egypt' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, example: 30.0444 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false, example: 31.2357 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false, example: 'Meet at the main gate of Khan El Khalili' })
  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  instantBook?: boolean;

  @ApiProperty({ required: false, type: [ItineraryStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryStepDto)
  itinerary?: ItineraryStepDto[];

  @ApiProperty({ required: false, type: [ScheduleSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedule?: ScheduleSlotDto[];
}
