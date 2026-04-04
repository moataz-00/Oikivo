import { IsEnum } from 'class-validator';

export class RespondCohostDto {
  @IsEnum(['accepted', 'declined'])
  response: 'accepted' | 'declined';
}
