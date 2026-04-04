import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AmenitiesService } from './amenities.service';

@ApiTags('amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all amenities grouped by category' })
  findAll() {
    return this.amenitiesService.findAll();
  }
}
