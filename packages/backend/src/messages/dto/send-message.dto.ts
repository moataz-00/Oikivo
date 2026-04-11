import { IsString, IsOptional, IsNumber, IsPositive, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @ApiProperty({ required: false, example: 1, description: 'Existing conversation ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  conversationId?: number;

  @ApiProperty({ required: false, example: 1, description: 'Property ID (to start new conversation)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  propertyId?: number;

  @ApiProperty({ required: false, example: 2, description: 'Host user ID (to start new conversation)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  hostId?: number;

  @ApiProperty({ example: 'Hi, is this property available for next weekend?' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;

  @ApiProperty({ required: false, enum: ['text', 'image'], default: 'text' })
  @IsOptional()
  @IsEnum(['text', 'image'])
  messageType?: 'text' | 'image';

  @ApiProperty({ required: false, description: 'Relative image path (for image messages)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
