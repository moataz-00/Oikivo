import { IsArray, IsString, IsBoolean, IsOptional, IsNumber, IsDateString } from 'class-validator';
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
  priceOverride?: number;
}

export class SeasonalPricingDto {
  @ApiProperty({ example: '2026-06-01', description: 'Start date (yyyy-MM-dd)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-08-31', description: 'End date (yyyy-MM-dd, inclusive)' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 650, description: 'Price per night for this period' })
  @Type(() => Number)
  @IsNumber()
  pricePerNight: number;

  @ApiProperty({ required: false, example: 'Summer season', description: 'Optional label for this rule' })
  @IsOptional()
  @IsString()
  label?: string;
}
