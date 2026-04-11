import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class BulkBlockDatesDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  propertyIds: number[];

  @IsArray()
  @ArrayNotEmpty()
  @IsDateString({}, { each: true })
  dates: string[];

  @IsBoolean()
  isBlocked: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceOverride?: number;
}

export class BulkSeasonalPricingDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  propertyIds: number[];

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;
}
