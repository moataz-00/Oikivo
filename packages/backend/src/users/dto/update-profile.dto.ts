import {
  IsString, IsOptional, IsDateString, IsIn, MaxLength, Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

/** Egyptian mobile number regex:
 *  Accepts: +2010xxxxxxxx | +2011xxxxxxxx | +2012xxxxxxxx | +2015xxxxxxxx
 *  Or local: 010xxxxxxxx | 011xxxxxxxx | 012xxxxxxxx | 015xxxxxxxx
 */
export const EGYPTIAN_PHONE_REGEX = /^(\+20|0)(10|11|12|15)\d{8}$/;

export class UpdateProfileBaseDto {
  @ApiProperty({ required: false, example: 'Ahmed' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false, example: 'Al-Rashid' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, example: '+201012345678', description: 'Egyptian mobile number (+2010x / +2011x / +2012x / +2015x)' })
  @IsOptional()
  @IsString()
  @Matches(EGYPTIAN_PHONE_REGEX, {
    message: 'Phone number must be a valid Egyptian mobile number (e.g. +201012345678 or 01012345678)',
  })
  phone?: string;

  @ApiProperty({ required: false, example: 'I love hosting travelers.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiProperty({ required: false, example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ required: false, enum: ['en', 'ar'] })
  @IsOptional()
  @IsIn(['en', 'ar'])
  preferredLanguage?: string;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

}

export class UpdateProfileDto extends PartialType(UpdateProfileBaseDto) {}
