import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyReviewDto {
  @ApiProperty({ example: 'Thank you for your kind review! We hope to host you again.' })
  @IsString()
  @IsNotEmpty()
  hostReply: string;
}
