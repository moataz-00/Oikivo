import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('host/listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all listings for the current host' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getHostListings(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.propertiesService.getHostListings(
      user.id,
      page ? Number(page) : 1,
      limit ? Math.min(Number(limit), 200) : 200,
    );
  }

  @Get('host/archived')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get archived listings for the current host (auto-purges >30 days)' })
  getArchivedListings(@CurrentUser() user: UserEntity) {
    return this.propertiesService.getArchivedListings(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID or UUID' })
  findOne(@Param('id') id: string) {
    if (id.includes('-')) {
      return this.propertiesService.findByUuid(id);
    }
    return this.propertiesService.findOne(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property listing' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateListingDto) {
    if (!user.isHost) throw new ForbiddenException('You must be a host to create listings');
    return this.propertiesService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a property listing' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateListingDto,
  ) {
    return this.propertiesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete (archive) a property listing' })
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.propertiesService.delete(id, user.id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft listing' })
  publish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.propertiesService.publish(id, user.id);
  }

  @Get(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pre-publish verification checklist for a listing' })
  verifyListing(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.propertiesService.verifyListing(id, user.id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a listing' })
  archive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.propertiesService.archive(id, user.id);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a listing back to draft' })
  unpublish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.propertiesService.unpublish(id, user.id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore an archived listing back to draft' })
  restore(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.propertiesService.restore(id, user.id);
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete a property (irreversible)' })
  permanentDelete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.propertiesService.permanentDelete(id, user.id);
  }

  @Patch(':id/amenities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update amenities for a property' })
  updateAmenities(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { amenityIds: number[] },
  ) {
    return this.propertiesService.update(id, user.id, { amenityIds: body.amenityIds });
  }

  @Patch(':id/house-rules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update house rules for a property' })
  updateHouseRules(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { rules: Array<{ rule: string; ruleAr?: string }> },
  ) {
    return this.propertiesService.updateHouseRules(id, body.rules);
  }

  @Get(':id/price-preview')
  @ApiOperation({ summary: 'Get price preview for date range' })
  @ApiQuery({ name: 'checkIn', required: true, example: '2026-04-01' })
  @ApiQuery({ name: 'checkOut', required: true, example: '2026-04-05' })
  @ApiQuery({ name: 'guests', required: true, example: 2 })
  getPricePreview(
    @Param('id', ParseIntPipe) id: number,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('guests') guests: string,
  ) {
    return this.propertiesService.getPricePreview(id, checkIn, checkOut, parseInt(guests) || 1);
  }

  @Post('bulk-action')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk publish, archive, or delete listings' })
  bulkAction(
    @CurrentUser() user: UserEntity,
    @Body() body: { ids: number[]; action: 'publish' | 'archive' | 'delete' },
  ) {
    return this.propertiesService.bulkAction(user.id, body.ids, body.action);
  }

  @Post(':id/transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer property ownership to another host by email' })
  transferProperty(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { newOwnerEmail: string },
  ) {
    return this.propertiesService.transferProperty(id, user.id, body.newOwnerEmail);
  }
}
