import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('wishlists')
@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  /** G6: Public share endpoint — no auth required */
  @Get('share/:token')
  @ApiOperation({ summary: 'View a shared wishlist by token (public)' })
  findByShareToken(@Param('token') token: string) {
    return this.wishlistsService.findByShareToken(token);
  }

  /** UUID-based lookup — used for authenticated detail page URLs */
  @Get('u/:uuid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a wishlist by UUID' })
  findOneByUuid(@Param('uuid') uuid: string, @CurrentUser() user: UserEntity) {
    return this.wishlistsService.findOneByUuid(uuid, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all wishlists for current user' })
  findAll(@CurrentUser() user: UserEntity) {
    return this.wishlistsService.findAll(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new wishlist' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateWishlistDto) {
    return this.wishlistsService.create(user.id, dto);
  }

  @Get('check/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if a property is wishlisted by the current user' })
  check(
    @CurrentUser() user: UserEntity,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    return this.wishlistsService.isPropertyWishlisted(user.id, propertyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific wishlist' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.wishlistsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a wishlist' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: Partial<CreateWishlistDto>,
  ) {
    return this.wishlistsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a wishlist' })
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.wishlistsService.delete(id, user.id);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a property to a wishlist' })
  addItem(
    @Param('id', ParseIntPipe) wishlistId: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { propertyId: number },
  ) {
    return this.wishlistsService.addItem(wishlistId, user.id, body.propertyId);
  }

  @Delete(':id/items/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a property from a wishlist' })
  removeItem(
    @Param('id', ParseIntPipe) wishlistId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.wishlistsService.removeItem(wishlistId, user.id, propertyId);
  }

  @Post(':id/rotate-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rotate share token for a wishlist (security feature)' })
  rotateToken(
    @Param('id', ParseIntPipe) wishlistId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.wishlistsService.rotateShareToken(wishlistId, user.id);
  }
}
