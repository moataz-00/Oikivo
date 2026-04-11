import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PriceAlertService } from './price-alert.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('price-alerts')
@Controller('price-alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PriceAlertController {
  constructor(private readonly priceAlertService: PriceAlertService) {}

  @Get()
  @ApiOperation({ summary: 'List my active price alerts' })
  findAll(@CurrentUser() user: UserEntity) {
    return this.priceAlertService.findMyAlerts(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a price alert for a property' })
  create(
    @CurrentUser() user: UserEntity,
    @Body() body: { propertyId: number; targetPrice: number },
  ) {
    return this.priceAlertService.create(user.id, body.propertyId, body.targetPrice);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price alert' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.priceAlertService.delete(id, user.id);
  }
}
