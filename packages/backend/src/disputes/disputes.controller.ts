import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Open a dispute for a completed or cancelled booking' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my disputes' })
  getMyDisputes(@CurrentUser() user: UserEntity) {
    return this.disputesService.getMyDisputes(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single dispute by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.disputesService.findOne(id, user.id);
  }

  @Patch(':id/update')
  @ApiOperation({ summary: 'Append additional information or evidence to an open dispute' })
  appendUpdate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body('message') message: string,
  ) {
    if (!message?.trim()) throw new BadRequestException('Message is required');
    return this.disputesService.appendUpdate(id, user.id, message);
  }
}
