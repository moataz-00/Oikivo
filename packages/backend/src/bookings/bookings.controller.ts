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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseIntPipe,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler'; // FIX BUG-GC1
import { validateMagicBytes } from '../common/utils/magic-bytes.util';
import { BookingsService } from './bookings.service';
import { InvoiceService } from './invoice.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';
import { MailService, tplAdminInstapaySubmitted } from '../mail/mail.service';

// ─── Deposit evidence multer storage ─────────────────────────────────────────
const depositEvidenceStorage = diskStorage({
  destination: (req, _file, cb) => {
    const bookingId = req.params.id;
    const dir = join(process.cwd(), 'uploads', 'deposits', String(bookingId));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `deposit-evidence-${Date.now()}-${randomUUID()}${extname(file.originalname)}`);
  },
});

const depositEvidenceFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|pdf)$/)) {
    return cb(new BadRequestException('Only images and PDFs are allowed for deposit evidence'), false);
  }
  cb(null, true);
};

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly invoiceService: InvoiceService,
    private readonly mailService: MailService,
  ) {}

  @Post()
  @Throttle({ default: { ttl: 3600000, limit: 5 } }) // FIX BUG-GC1: Max 5 bookings per hour
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

  @Get('my-payments')
  @ApiOperation({ summary: 'Get guest payment history' })
  getMyPaymentHistory(@CurrentUser() user: UserEntity) {
    return this.bookingsService.getGuestPaymentHistory(user.id);
  }

  @Get('host/reservations')
  @ApiOperation({ summary: 'Get all reservations for the current host' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getHostReservations(
    @CurrentUser() user: UserEntity,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookingsService.getHostBookings(user.id, status, page || 1, limit || 20);
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

  @Get('host/forecast')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'H13: Revenue forecast for next 90 days based on confirmed bookings + historical data' })
  getRevenueForecast(@CurrentUser() user: UserEntity) {
    return this.bookingsService.getRevenueForecast(user.id);
  }

  @Get('host/market-insights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'H12: Market benchmarking insights — compare your listings with area averages' })
  getMarketInsights(@CurrentUser() user: UserEntity) {
    return this.bookingsService.getMarketInsights(user.id);
  }

  @Get('host/ranking-tips/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'H14: Get ranking improvement tips for a specific property' })
  getRankingTips(@CurrentUser() user: UserEntity, @Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.bookingsService.getRankingTips(propertyId, user.id);
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

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Download booking invoice as PDF' })
  async getInvoice(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Res() res: Response,
  ) {
    const booking = await this.bookingsService.findOne(id);
    if (booking.guestId !== user.id && booking.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Not authorized');
    }
    const pdfBuffer = await this.invoiceService.generateInvoice(booking);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${booking.bookingUuid || booking.id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
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
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
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
  async uploadPaymentProof(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    // SEC-02: Validate magic bytes to prevent MIME-type spoofing
    validateMagicBytes(file.path, ['jpeg', 'png', 'webp', 'gif']);
    const proofUrl = `/uploads/payments/${id}/${file.filename}`;

    // Notify support team of new InstaPay proof upload
    try {
      const booking = await this.bookingsService.findOne(id);
      const guest = booking?.guest;
      const guestName = guest ? `${guest.firstName} ${guest.lastName}` : `Guest #${user.id}`;
      const guestEmail = guest?.email ?? '';
      const propertyTitle = booking?.property?.title ?? `Booking #${id}`;
      const currency = booking?.currency ?? 'EGP';
      const totalAmount = booking ? Number(booking.totalAmount).toFixed(2) : 'N/A';
      const checkIn = booking?.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-GB') : 'N/A';
      const checkOut = booking?.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-GB') : 'N/A';
      const reference = (booking as any)?.instapayReference ?? '';
      const proofUrl = (booking as any)?.paymentProofUrl ?? null;
      const adminUrl = `${process.env.ADMIN_URL ?? 'http://localhost:3002'}/bookings`;
      await this.mailService.send(
        'oikivo.support@gmail.com',
        `⚡ InstaPay Payment Submitted — Booking #${id} needs verification`,
        tplAdminInstapaySubmitted(
          guestName,
          guestEmail,
          `#${id}`,
          propertyTitle,
          checkIn,
          checkOut,
          totalAmount,
          currency,
          reference,
          proofUrl,
          48,
          adminUrl,
        ),
      );
    } catch (_e) {
      // Non-blocking — don't fail the upload if email fails
    }

    // BE-03: Create in-app notification for all admin users
    this.bookingsService.notifyAdminsOfPaymentProofUpload(id).catch(() => {});

    return { url: proofUrl };
  }

  @Get(':id/payment-proof/:filename')
  @ApiOperation({ summary: 'Get payment proof file (authenticated - guest, host, or admin only)' })
  async getPaymentProof(
    @Param('id', ParseIntPipe) bookingId: number,
    @Param('filename') filename: string,
    @CurrentUser() user: UserEntity,
    @Res() res: Response,
  ) {
    // Verify booking exists and check ownership
    const booking = await this.bookingsService.findOne(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    // Only guest, host, or admin can access payment proof
    const isGuest = booking.guestId === user.id;
    const isHost = booking.hostId === user.id;
    const isAdmin = user.isAdmin;

    if (!isGuest && !isHost && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view this payment proof');
    }

    // Serve the file
    const filePath = join(process.cwd(), 'uploads', 'payments', bookingId.toString(), filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Payment proof file not found');
    }

    res.sendFile(filePath);
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

  @Patch(':id/host-notes')
  @ApiOperation({ summary: 'Host updates booking-specific notes/check-in instructions' })
  updateHostNotes(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { hostNote?: string; hostCheckInInstructions?: string },
  ) {
    return this.bookingsService.updateHostNotes(id, user.id, body);
  }

  // ─── Security Deposit ──────────────────────────────────────────────────────

  @Post(':id/deposit/evidence')
  @ApiOperation({ summary: 'Upload evidence photos for a deposit claim (host only, up to 10 files)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: depositEvidenceStorage,
      fileFilter: depositEvidenceFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadDepositEvidence(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    const booking = await this.bookingsService.findOne(id);
    if (booking.hostId !== user.id) throw new ForbiddenException('Not your booking');
    const paths = files.map((f) => `/uploads/deposits/${id}/${f.filename}`);
    return { message: `${files.length} file(s) uploaded`, paths };
  }

  @Post(':id/deposit/claim')
  @ApiOperation({ summary: 'Host claims security deposit (within 48 h of checkout)' })
  claimDeposit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { reason: string; evidencePaths?: string[] },
  ) {
    return this.bookingsService.claimDeposit(id, user.id, body.reason, body.evidencePaths);
  }

  @Delete(':id/deposit/claim')
  @ApiOperation({ summary: 'Host cancels a pending deposit claim (reverts to held)' })
  cancelDepositClaim(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.bookingsService.cancelDepositClaim(id, user.id);
  }

  @Patch(':id/deposit/claim')
  @ApiOperation({ summary: 'Host edits a pending deposit claim (reason / evidence)' })
  editDepositClaim(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body() body: { reason: string; evidencePaths?: string[] },
  ) {
    return this.bookingsService.editDepositClaim(id, user.id, body.reason, body.evidencePaths);
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
