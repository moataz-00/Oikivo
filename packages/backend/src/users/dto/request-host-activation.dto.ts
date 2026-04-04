import { IsIn, IsOptional } from 'class-validator';

export class RequestHostActivationDto {
  @IsOptional()
  @IsIn(['en', 'ar'])
  locale?: 'en' | 'ar';
}
