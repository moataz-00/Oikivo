import {
  Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('earnings')
  @ApiOperation({ summary: 'Get host earnings summary and list' })
  getEarnings(@CurrentUser() user: UserEntity) {
    return this.payoutsService.getEarningsSummary(user.id);
  }

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a payout of available earnings' })
  requestPayout(
    @CurrentUser() user: UserEntity,
    @Body() dto: RequestPayoutDto,
  ) {
    return this.payoutsService.requestPayout(user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payout history for current host' })
  getHistory(@CurrentUser() user: UserEntity) {
    return this.payoutsService.getPayoutHistory(user.id);
  }
}
