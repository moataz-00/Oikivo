import { IsString, IsOptional, IsArray, IsNumber, IsEnum, Min, Max, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ApplyAsConsultantDto {
  @ApiProperty({ example: 'Ahmed Hospitality Expert' })
  @IsString()
  @MaxLength(120)
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiProperty({ example: ['pricing_strategy', 'guest_experience'] })
  @IsArray()
  @IsString({ each: true })
  specializations: string[];

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsExperience: number;

  @ApiProperty({ example: ['en', 'ar'] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @ApiPropertyOptional({ example: 'EGP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}

export class UpdateConsultantProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}

export class BookConsultationDto {
  @ApiProperty({ example: 1, description: 'Consultant ID' })
  @IsNumber()
  consultantId: number;

  @ApiProperty({ example: 60, description: 'Session duration in minutes (15/30/45/60/90/120)' })
  @IsNumber()
  @Min(15)
  @Max(480)
  durationMinutes: number;

  @ApiPropertyOptional({ example: 'video_call' })
  @IsOptional()
  @IsEnum(['video_call', 'in_person', 'phone', 'chat'])
  deliveryMode?: string;

  @ApiProperty({ example: '2026-04-10T14:00:00Z' })
  @IsString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  clientNote?: string;

  @ApiPropertyOptional({ example: 'card' })
  @IsOptional()
  @IsEnum(['card', 'instapay', 'wallet'])
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 1, description: 'Service ID for per-service pricing (overrides hourly rate)' })
  @IsOptional()
  @IsNumber()
  serviceId?: number;
}

export class RespondToBookingDto {
  @ApiProperty({ enum: ['confirmed', 'cancelled'] })
  @IsEnum(['confirmed', 'cancelled'])
  action: 'confirmed' | 'cancelled';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  consultantNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}

export class CompleteBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  consultantNote?: string;
}

export class CreateConsultationReviewDto {
  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  expertiseRating?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  valueRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class ReplyToReviewDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  reply: string;
}

export class AdminReviewConsultantDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}

export class SetAvailabilityDto {
  @ApiProperty({ example: [{ dayOfWeek: 0, startTime: '09:00', endTime: '17:00' }] })
  @IsArray()
  slots: { dayOfWeek: number; startTime: string; endTime: string }[];
}

const CONSULTATION_CATEGORIES = [
  'listing_optimization', 'pricing_strategy', 'interior_design',
  'guest_experience', 'photography', 'superhost_coaching',
  'property_management', 'legal_compliance', 'marketing',
  'revenue_management', 'general',
] as const;

const DELIVERY_MODES = ['video_call', 'in_person', 'phone', 'chat'] as const;

export class CreateConsultationServiceDto {
  @ApiProperty({ example: 'Listing Optimization Session' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiProperty({ enum: CONSULTATION_CATEGORIES })
  @IsEnum(CONSULTATION_CATEGORIES)
  category: string;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(480)
  durationMinutes: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'EGP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ enum: DELIVERY_MODES })
  @IsOptional()
  @IsEnum(DELIVERY_MODES)
  deliveryMode?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  maxBookingsPerDay?: number;
}

export class UpdateConsultationServiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ enum: CONSULTATION_CATEGORIES })
  @IsOptional()
  @IsEnum(CONSULTATION_CATEGORIES)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ enum: DELIVERY_MODES })
  @IsOptional()
  @IsEnum(DELIVERY_MODES)
  deliveryMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  maxBookingsPerDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BlockVacationDto {
  @ApiProperty({ example: '2026-08-01', description: 'Start date (YYYY-MM-DD)' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2026-08-14', description: 'End date (YYYY-MM-DD, inclusive)' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ example: 'Family vacation' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class UpdateConsultantPayoutSettingsDto {
  @ApiProperty({ example: 'instapay', enum: ['instapay', 'bank_transfer'] })
  @IsEnum(['instapay', 'bank_transfer'])
  method: 'instapay' | 'bank_transfer';

  @ApiProperty({ example: '01000000000', description: 'InstaPay phone or bank IBAN' })
  @IsString()
  @MaxLength(300)
  accountDetails: string;
}

export class RequestConsultantPayoutDto {
  @ApiProperty({ example: 1500.0, description: 'Amount to withdraw (must not exceed available balance)' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ example: 'instapay', enum: ['instapay', 'bank_transfer'] })
  @IsOptional()
  @IsEnum(['instapay', 'bank_transfer'])
  method?: 'instapay' | 'bank_transfer';

  @ApiPropertyOptional({ example: '01000000000' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  accountDetails?: string;
}

export class AdminProcessConsultantPayoutDto {
  @ApiProperty({ enum: ['processing', 'completed', 'failed'] })
  @IsEnum(['processing', 'completed', 'failed'])
  status: 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
