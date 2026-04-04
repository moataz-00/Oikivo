import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Al-Rashid' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false, enum: ['en', 'ar'], example: 'ar' })
  @IsOptional()
  @IsIn(['en', 'ar'])
  preferredLanguage?: string;
}
