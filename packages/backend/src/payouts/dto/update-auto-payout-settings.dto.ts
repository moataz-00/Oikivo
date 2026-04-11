import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAutoPayoutSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(['weekly', 'monthly'])
  frequency?: 'weekly' | 'monthly';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(31)
  day?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minBalance?: number;

  @IsOptional()
  @IsEnum(['instapay', 'bank_transfer', 'cash'])
  method?: 'instapay' | 'bank_transfer' | 'cash';

  @IsOptional()
  @IsString()
  accountDetails?: string;
}
