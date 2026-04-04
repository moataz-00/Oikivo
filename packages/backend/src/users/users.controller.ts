import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestHostActivationDto } from './dto/request-host-activation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: UserEntity) {
    return this.usersService.findById(user.id);
  }

  @Get('available-cohosts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Browse users available to be invited as co-host or cleaner' })
  getAvailableCohosts(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.usersService.getAvailableCohosts(
      search,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser() user: UserEntity, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/become-host')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Become a host' })
  becomeHost(@CurrentUser() user: UserEntity) {
    return this.usersService.makeHost(user.id);
  }

  @Post('me/request-host-activation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send host activation email to current user' })
  requestHostActivation(
    @CurrentUser() user: UserEntity,
    @Body() dto: RequestHostActivationDto,
  ) {
    return this.usersService.requestHostActivation(user.id, dto.locale || 'en');
  }

  @Get('host-activation/confirm')
  @ApiOperation({ summary: 'Confirm host activation using email token' })
  confirmHostActivation(@Query('token') token?: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.usersService.confirmHostActivation(token);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'avatars'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(user.id, avatarUrl);
  }

  @Post('me/verify-id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit government ID document for verification' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'id-documents'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `id-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|pdf)$/)) {
          return cb(new BadRequestException('Only image or PDF files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadIdDocument(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const docUrl = `/uploads/id-documents/${file.filename}`;
    return this.usersService.submitIdDocument(user.id, docUrl);
  }

  @Get('profile/:uuid')
  @ApiOperation({ summary: 'Get public user profile by UUID (secure)' })
  getPublicProfileByUuid(@Param('uuid') uuid: string) {
    return this.usersService.getPublicProfileByUuid(uuid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile' })
  getPublicProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPublicProfile(id);
  }

  @Get(':id/listings')
  @ApiOperation({ summary: 'Get published listings of a host (public)' })
  getHostPublicListings(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getHostPublicListings(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get reviews for a user (as host)' })
  getUserReviews(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserReviews(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  getUserStats(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserStats(id);
  }

  @Get('me/notification-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification preferences for current user' })
  getNotificationPreferences(@CurrentUser() user: UserEntity) {
    return this.usersService.getNotificationPreferences(user.id);
  }

  @Patch('me/notification-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences for current user' })
  updateNotificationPreferences(
    @CurrentUser() user: UserEntity,
    @Body() prefs: Record<string, boolean>,
  ) {
    return this.usersService.updateNotificationPreferences(user.id, prefs);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (anonymize) current user account and personal data' })
  async deleteMe(@CurrentUser() user: UserEntity) {
    await this.usersService.deleteAccount(user.id);
    return { message: 'Account deleted successfully' };
  }

  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all personal data (GDPR / PDPL data portability)' })
  exportMyData(@CurrentUser() user: UserEntity) {
    return this.usersService.exportUserData(user.id);
  }
}
