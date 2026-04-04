import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CohostsService } from './cohosts.service';
import { InviteCohostDto } from './dto/invite-cohost.dto';
import { RespondCohostDto } from './dto/respond-cohost.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CoHostGuard } from '../common/guards/cohost.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('cohosts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties/:propertyId/cohosts')
export class CohostsController {
  constructor(private readonly cohostsService: CohostsService) {}

  // B8: pagination query params
  @Get()
  @UseGuards(CoHostGuard)
  @ApiOperation({ summary: 'List cohosts for a property' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getCohosts(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cohostsService.getCohosts(
      propertyId,
      user.id,
      page ? Number(page) : 1,
      limit ? Math.min(Number(limit), 100) : 50,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Invite a cohost to a property (owner only)' })
  invite(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: InviteCohostDto,
  ) {
    return this.cohostsService.inviteCohost(propertyId, user.id, dto);
  }

  // B7: validate cohostId in URL matches the authenticated user
  @Patch(':cohostId/respond')
  @ApiOperation({ summary: 'Accept or decline a cohost invitation' })
  respond(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('cohostId', ParseIntPipe) cohostId: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: RespondCohostDto,
  ) {
    if (Number(cohostId) !== Number(user.id)) {
      throw new ForbiddenException('You can only respond to your own invitations');
    }
    return this.cohostsService.respondToInvite(propertyId, user.id, dto);
  }

  // B4: re-invite a declined cohost
  @Patch(':cohostId/reinvite')
  @ApiOperation({ summary: 'Re-invite a declined cohost (owner only)' })
  reinvite(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('cohostId', ParseIntPipe) cohostId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.cohostsService.reinviteCohost(propertyId, user.id, cohostId);
  }

  @Delete(':cohostId')
  @ApiOperation({ summary: 'Remove a cohost from a property (owner only)' })
  remove(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('cohostId', ParseIntPipe) cohostId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.cohostsService.removeCohost(propertyId, user.id, cohostId);
  }
}

// Separate controller for "my invites" / "my properties" (not property-scoped)
import { Controller as Ctrl2 } from '@nestjs/common';

@ApiTags('cohosts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Ctrl2('cohosts')
export class CohostInvitesController {
  constructor(private readonly cohostsService: CohostsService) {}

  @Get('my-invites')
  @ApiOperation({ summary: 'Get pending cohost invitations for current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyInvites(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cohostsService.getMyInvites(
      user.id,
      page ? Number(page) : 1,
      limit ? Math.min(Number(limit), 200) : 100,
    );
  }

  @Get('my-team')
  @ApiOperation({ summary: 'Get all co-hosts across all properties owned by the current host' })
  getMyTeam(@CurrentUser() user: UserEntity) {
    return this.cohostsService.getMyTeam(user.id);
  }

  // B5: properties where the current user is an accepted co-host/cleaner
  @Get('my-properties')
  @ApiOperation({ summary: 'Get properties where the current user is an accepted cohost' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyProperties(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cohostsService.getMyProperties(
      user.id,
      page ? Number(page) : 1,
      limit ? Math.min(Number(limit), 200) : 100,
    );
  }
}
