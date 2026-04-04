import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestPayoutDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @IsEnum(['instapay', 'bank_transfer', 'cash'])
  method: 'instapay' | 'bank_transfer' | 'cash';

  @IsString()
  @IsNotEmpty()
  accountDetails: string;

  @IsOptional()
  @IsString()
  note?: string;
}
