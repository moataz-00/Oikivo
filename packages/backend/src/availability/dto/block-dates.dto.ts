import { IsArray, IsString, IsBoolean, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BlockDatesDto {
  @ApiProperty({ type: [String], example: ['2026-04-01', '2026-04-02'] })
  @IsArray()
  @IsDateString({}, { each: true })
  dates: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  isBlocked: boolean;

  @ApiProperty({ required: false, example: 350.00, description: 'Price override for these dates' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100000, { message: 'Price override cannot exceed 100,000' })
  priceOverride?: number;
}

export class SeasonalPricingDto {
  @ApiProperty({ example: '2026-06-01', description: 'Start date (yyyy-MM-dd)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-08-31', description: 'End date (yyyy-MM-dd, inclusive)' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 650, description: 'Price per night for this period (max 100,000)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Seasonal price must be at least 1' })
  @Max(100000, { message: 'Seasonal price cannot exceed 100,000' })
  pricePerNight: number;

  @ApiProperty({ required: false, example: 'Summer season', description: 'Optional label for this rule' })
  @IsOptional()
  @IsString()
  label?: string;
}

export class SetPriceDatesDto {
  @ApiProperty({ type: [String], example: ['2026-04-01', '2026-04-02'] })
  @IsArray()
  @IsDateString({}, { each: true })
  dates: string[];

  @ApiProperty({ example: 350, description: 'Custom price per night for these dates (max 100,000)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Price must be at least 1' })
  @Max(100000, { message: 'Price cannot exceed 100,000' })
  pricePerNight: number;
}

export class ResetPriceDatesDto {
  @ApiProperty({ type: [String], example: ['2026-04-01', '2026-04-02'] })
  @IsArray()
  @IsDateString({}, { each: true })
  dates: string[];
}
