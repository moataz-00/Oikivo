import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AvailabilityService } from './availability.service';
import { ICalSyncService } from './ical-sync.service';
import { BlockDatesDto, SeasonalPricingDto } from './dto/block-dates.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly icalSyncService: ICalSyncService,
  ) {}

  @Get(':propertyId')
  @ApiOperation({ summary: 'Get availability calendar for a property' })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'month', required: true, example: 4 })
  getCalendar(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.availabilityService.getCalendar(propertyId, y, m);
  }

  @Get(':propertyId/ranges')
  @ApiOperation({ summary: 'Get available date ranges for a property' })
  @ApiQuery({ name: 'from', required: true, example: '2026-04-01' })
  @ApiQuery({ name: 'to', required: true, example: '2026-04-30' })
  getAvailableRanges(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.availabilityService.getAvailableRanges(propertyId, from, to);
  }

  @Post(':propertyId/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block or unblock dates for a property (host only)' })
  blockDates(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: BlockDatesDto,
  ) {
    return this.availabilityService.blockDates(propertyId, user.id, dto);
  }

  @Post(':propertyId/seasonal-pricing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a seasonal price rule for a date range (host only)' })
  setSeasonalPricing(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: SeasonalPricingDto,
  ) {
    return this.availabilityService.setSeasonalPricing(propertyId, user.id, dto);
  }

  // ─── iCal / Channel Manager ────────────────────────────────────────────────

  @Get(':propertyId/channels')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List iCal feed URLs connected to a property (host only)' })
  getChannels(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.icalSyncService.getSources(propertyId, user.id);
  }

  @Post(':propertyId/channels')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect an iCal feed URL to a property (host only)' })
  addChannel(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { label: string; url: string },
  ) {
    return this.icalSyncService.addSource(propertyId, user.id, body.label, body.url);
  }

  @Delete(':propertyId/channels/:sourceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect an iCal feed from a property (host only)' })
  removeChannel(
    @Param('propertyId', ParseIntPipe) _propertyId: number,
    @Param('sourceId', ParseIntPipe) sourceId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.icalSyncService.removeSource(sourceId, user.id);
  }

  @Post(':propertyId/channels/:sourceId/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger a sync for one iCal feed (host only)' })
  syncChannel(
    @Param('propertyId', ParseIntPipe) _propertyId: number,
    @Param('sourceId', ParseIntPipe) sourceId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.icalSyncService.triggerSync(sourceId, user.id);
  }

  /**
   * Public iCal export — allows Airbnb/Booking.com to subscribe to this
   * property's blocked dates so the sync is bidirectional.
   */
  @Get(':propertyId/calendar.ics')
  @ApiOperation({ summary: 'Export property availability as an iCal feed (.ics)' })
  async exportIcal(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Res() res: Response,
  ) {
    const ics = await this.icalSyncService.exportIcal(propertyId);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="property-${propertyId}.ics"`);
    res.send(ics);
  }
}
