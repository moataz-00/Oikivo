import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWishlistDto {
  @ApiProperty({ example: 'My Riyadh Favorites' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, enum: ['private', 'public'], default: 'private' })
  @IsOptional()
  @IsIn(['private', 'public'])
  visibility?: 'private' | 'public';
}
