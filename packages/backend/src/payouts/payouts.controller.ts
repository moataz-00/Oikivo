import {
  Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Patch, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { UpdateAutoPayoutSettingsDto } from './dto/update-auto-payout-settings.dto';
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

  @Get('settings')
  @ApiOperation({ summary: 'Get automatic payout settings for current host' })
  getSettings(@CurrentUser() user: UserEntity) {
    return this.payoutsService.getAutoPayoutSettings(user.id);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update automatic payout settings for current host' })
  updateSettings(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateAutoPayoutSettingsDto,
  ) {
    return this.payoutsService.updateAutoPayoutSettings(user.id, dto);
  }

  @Get('tax-documents/annual-summary')
  @ApiOperation({ summary: 'Get annual payout tax summary for current host' })
  getAnnualTaxSummary(
    @CurrentUser() user: UserEntity,
    @Query('year') year?: string,
  ) {
    const y = year ? Number(year) : new Date().getFullYear();
    return this.payoutsService.getAnnualTaxSummary(user.id, y);
  }

  @Get('tax-documents/payout-invoices')
  @ApiOperation({ summary: 'Get payout invoice documents for current host' })
  getPayoutInvoices(
    @CurrentUser() user: UserEntity,
    @Query('year') year?: string,
  ) {
    const y = year ? Number(year) : undefined;
    return this.payoutsService.getPayoutInvoices(user.id, y);
  }
}
