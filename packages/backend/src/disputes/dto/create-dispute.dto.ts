import { IsString, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDisputeDto {
  @ApiProperty({ example: 1, description: 'Booking ID to raise dispute for' })
  @IsNotEmpty()
  bookingId: number;

  @ApiProperty({
    enum: ['property_not_as_described', 'no_show', 'safety_concern', 'refund_request', 'damage_claim', 'other'],
    example: 'property_not_as_described',
  })
  @IsEnum(['property_not_as_described', 'no_show', 'safety_concern', 'refund_request', 'damage_claim', 'other'])
  category: string;

  @ApiProperty({ example: 'Property was not as described in the listing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'The listing showed an ocean view but the room faced a parking lot.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
}
