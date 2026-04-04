import { IsEmail, IsOptional, IsEnum } from 'class-validator';

export class InviteCohostDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(['co_host'])
  role?: 'co_host';
}
