import { IsString, IsOptional, IsArray, IsNumber, IsEnum, Min, Max, MaxLength, IsBoolean, ValidateNested, IsInt, Matches, IsDateString } from 'class-validator';
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
  @Max(10000)
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
  @Max(10000)
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
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  clientNote?: string;

  @ApiPropertyOptional({ example: 'Africa/Cairo', description: 'Client IANA timezone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  clientTimezone?: string;
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

export class AvailabilitySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:mm format' })
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:mm format' })
  endTime: string;
}

export class SetAvailabilityDto {
  @ApiProperty({ example: [{ dayOfWeek: 0, startTime: '09:00', endTime: '17:00' }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
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

export class AdminMarkNoShowDto {
  @ApiProperty({ enum: ['client', 'consultant'], description: 'Who did not show up' })
  @IsEnum(['client', 'consultant'])
  noShowParty: 'client' | 'consultant';
}

export class AdminResolveDisputeDto {
  @ApiProperty({ enum: ['refund_client', 'pay_consultant', 'split'], description: 'How to resolve the dispute' })
  @IsEnum(['refund_client', 'pay_consultant', 'split'])
  resolution: 'refund_client' | 'pay_consultant' | 'split';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

// MISS6: Reschedule a confirmed booking
export class RescheduleBookingDto {
  @ApiProperty({ description: 'New scheduled date-time (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Reason for rescheduling' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
