import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SearchService } from './search.service';
import { SearchDto } from './search.dto';

@ApiTags('search')
@UseGuards(ThrottlerGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  @ApiOperation({ summary: 'Search properties with filters' })
  search(@Query() dto: SearchDto) {
    return this.searchService.search(dto);
  }

  @Get('nearby')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Find nearby properties using spatial index + ST_Distance_Sphere' })
  @ApiQuery({ name: 'lat', required: true, example: 24.7136 })
  @ApiQuery({ name: 'lng', required: true, example: 46.6753 })
  @ApiQuery({ name: 'radius', required: false, example: 10, description: 'Radius in km' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  nearbyProperties(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
    @Query('limit') limit: string,
  ) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (
      !isFinite(parsedLat) || !isFinite(parsedLng) ||
      parsedLat < -90 || parsedLat > 90 ||
      parsedLng < -180 || parsedLng > 180
    ) {
      throw new BadRequestException('lat must be −90..90 and lng must be −180..180');
    }
    return this.searchService.nearbyProperties(
      parsedLat,
      parsedLng,
      parseFloat(radius) || 10,
      Math.min(parseInt(limit) || 20, 100),
    );
  }

  @Get('popular-cities')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300_000) // 5 minutes
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Get top 10 popular cities by property count' })
  getPopularCities() {
    return this.searchService.getPopularCities();
  }
}
