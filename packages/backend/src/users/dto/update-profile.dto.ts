import {
  IsString, IsOptional, IsDateString, IsIn, MaxLength, Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

/** International phone number — accepts E.164 (+[country][number]) or local (0[number]).
 *  Since verification is via WhatsApp, any valid international number is allowed.
 */
export const PHONE_REGEX = /^\+[1-9]\d{5,14}$|^0[1-9]\d{5,13}$/;

export class UpdateProfileBaseDto {
  @ApiProperty({ required: false, example: 'Ahmed' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false, example: 'Al-Rashid' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, example: '+201012345678', description: 'International phone number (E.164: +[country][number] or local: 0[number])' })
  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, {
    message: 'Phone number must be a valid international number (e.g. +201012345678, +12025551234, +4916099858405)',
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
