import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyExperienceReviewDto {
  @ApiProperty({ example: 'Thank you so much! Glad you enjoyed the tour.' })
  @IsString()
  hostReply: string;
}
