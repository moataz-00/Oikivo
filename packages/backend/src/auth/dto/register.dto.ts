import { IsEmail, IsString, MinLength, IsOptional, IsIn, Matches } from 'class-validator';
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ required: false, enum: ['en', 'ar'], example: 'ar' })
  @IsOptional()
  @IsIn(['en', 'ar'])
  preferredLanguage?: string;
}
