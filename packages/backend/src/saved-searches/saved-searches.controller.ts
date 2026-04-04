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
import { SavedSearchesService } from './saved-searches.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('saved-searches')
@Controller('saved-searches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all saved searches for current user' })
  findAll(@CurrentUser() user: UserEntity) {
    return this.savedSearchesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new search' })
  create(
    @CurrentUser() user: UserEntity,
    @Body() body: { name: string; filters: Record<string, unknown> },
  ) {
    return this.savedSearchesService.create(user.id, body.name, body.filters);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved search' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.savedSearchesService.delete(id, user.id);
  }
}
