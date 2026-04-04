import {
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExperienceBookingDto {
  @ApiProperty({ example: 1, description: 'Experience ID' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  experienceId: number;

  @ApiProperty({ example: '2026-05-15' })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  guestsCount: number;

  @ApiProperty({ required: false, example: 'We have one vegetarian in the group' })
  @IsOptional()
  @IsString()
  guestNote?: string;
}
