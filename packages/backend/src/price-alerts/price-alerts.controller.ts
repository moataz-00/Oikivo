import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PriceAlertsService } from './price-alerts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('price-alerts')
@Controller('price-alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List all price alerts for the current user' })
  findAll(@CurrentUser() user: UserEntity) {
    return this.priceAlertsService.findAll(user.id);
  }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Create or update a price alert for a property' })
  create(
    @CurrentUser() user: UserEntity,
    @Body() body: { propertyId: number; targetPrice: number },
  ) {
    return this.priceAlertsService.create(user.id, body.propertyId, body.targetPrice);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a price alert by ID' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.priceAlertsService.delete(id, user.id);
  }

  @Delete('property/:propertyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove price alert for a specific property' })
  deleteByProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.priceAlertsService.deleteByProperty(propertyId, user.id);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get price alert for a specific property (if any)' })
  findByProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.priceAlertsService.findByProperty(propertyId, user.id);
  }
}
