import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestPayoutDto {
  @IsNumber()
  @Min(50, { message: 'Minimum payout amount is 50 EGP' })
  @Type(() => Number)
  amount: number;

  @IsEnum(['instapay', 'bank_transfer', 'cash'])
  method: 'instapay' | 'bank_transfer' | 'cash';

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  accountDetails: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
