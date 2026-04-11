import {
  IsNumber,
  IsString,
  IsOptional,
  IsPositive,
  IsDateString,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ example: 1, description: 'Property ID' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  propertyId: number;

  @ApiProperty({ example: '2026-04-10' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-04-15' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  guestsCount: number;

  @ApiProperty({ required: false, example: 'We are a couple celebrating our anniversary.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  guestNote?: string;

  @ApiProperty({ required: false, example: 'We would prefer a quiet room.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  specialRequests?: string;

  @ApiProperty({ required: false, example: true, description: 'Guest acknowledges property house rules' })
  @IsOptional()
  @IsBoolean()
  houseRulesAcknowledged?: boolean;

  @ApiProperty({ required: false, example: 'USD', description: 'Guest preferred display currency for emails and receipts' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  displayCurrency?: string;
}
