import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('my-trips')
  @ApiOperation({ summary: 'Get all bookings for the current guest' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'declined'] })
  getMyTrips(@CurrentUser() user: UserEntity, @Query('status') status?: string) {
    return this.bookingsService.getGuestBookings(user.id, status);
  }

  @Get('host/reservations')
  @ApiOperation({ summary: 'Get all reservations for the current host' })
  @ApiQuery({ name: 'status', required: false })
  getHostReservations(@CurrentUser() user: UserEntity, @Query('status') status?: string) {
    return this.bookingsService.getHostBookings(user.id, status);
  }

  @Get('host/calendar')
  @ApiOperation({ summary: 'Get all bookings across all host listings for a given month' })
  @ApiQuery({ name: 'month', required: true, example: '2026-06', description: 'YYYY-MM format' })
  getHostCalendar(@CurrentUser() user: UserEntity, @Query('month') month: string) {
    const m = month ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return this.bookingsService.getHostCalendar(user.id, m);
  }

  @Get('host/pending-payments')
  @ApiOperation({ summary: 'Get bookings with submitted InstaPay payment awaiting host confirmation' })
  getHostPendingPayments(@CurrentUser() user: UserEntity) {
    return this.bookingsService.getHostPendingPayments(user.id);
  }

  @Get('host/analytics')
  @ApiOperation({ summary: 'Get booking & revenue analytics for the current host' })
  getHostAnalytics(@CurrentUser() user: UserEntity) {
    return this.bookingsService.getHostAnalytics(user.id);
  }

  @Get('ref/:uuid')
  @ApiOperation({ summary: 'Get booking by UUID reference' })
  async findOneByRef(
    @Param('uuid') uuid: string,
    @CurrentUser() user: UserEntity,
  ) {
    const booking = await this.bookingsService.findOneByRef(uuid);
    if (booking.guestId !== user.id && booking.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Not authorized to view this booking');
    }
    return booking;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    const booking = await this.bookingsService.findOne(id);
    if (booking.guestId !== user.id && booking.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Not authorized to view this booking');
    }
    return booking;
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm a booking (host only)' })
  confirm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.bookingsService.confirm(id, user.id);
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Decline a booking (host only)' })
  decline(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.decline(id, user.id, body.reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (guest or host)' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancel(id, user.id, body.reason);
  }

  @Patch(':id/modify')
  @ApiOperation({ summary: 'Modify booking dates (guest only)' })
  modify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { checkIn: string; checkOut: string; guestsCount?: number },
  ) {
    return this.bookingsService.modify(id, user.id, body);
  }

  @Get(':id/cancellation-preview')
  @ApiOperation({ summary: 'Preview cancellation refund before confirming' })
  getCancellationPreview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.bookingsService.getCancellationPreview(id, user.id);
  }

  @Patch(':id/submit-payment')
  @ApiOperation({ summary: 'Submit InstaPay payment reference (guest)' })
  submitPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { method: string; reference: string; note?: string; proofUrl?: string },
  ) {
    return this.bookingsService.submitPayment(id, user.id, body);
  }

  @Post(':id/upload-payment-proof')
  @ApiOperation({ summary: 'Upload InstaPay transaction screenshot (guest)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'payments', req.params.id);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          cb(null, `proof-${Date.now()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadPaymentProof(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/payments/${id}/${file.filename}` };
  }

  @Patch(':id/confirm-payment')
  @ApiOperation({ summary: 'Confirm payment received (host or admin)' })
  confirmPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.bookingsService.confirmPayment(id, user.id, user.isAdmin);
  }

  @Patch(':id/decline-payment')
  @ApiOperation({ summary: 'Decline InstaPay payment (host or admin)' })
  declinePayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.declinePayment(id, user.id, user.isAdmin, body.reason);
  }

  // ─── Security Deposit ──────────────────────────────────────────────────────

  @Post(':id/deposit/claim')
  @ApiOperation({ summary: 'Host claims security deposit (within 48 h of checkout)' })
  claimDeposit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { reason: string },
  ) {
    return this.bookingsService.claimDeposit(id, user.id, body.reason);
  }

  @Patch(':id/deposit/release')
  @ApiOperation({ summary: 'Admin releases security deposit back to guest' })
  releaseDeposit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.bookingsService.releaseDeposit(id);
  }
}
