import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, ParseIntPipe,
  UseInterceptors, UploadedFiles, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConsultationsService } from './consultations.service';
import {
  ApplyAsConsultantDto, UpdateConsultantProfileDto,
  BookConsultationDto, RespondToBookingDto, CompleteBookingDto,
  CreateConsultationReviewDto, ReplyToReviewDto,
  AdminReviewConsultantDto, SetAvailabilityDto,
  BlockVacationDto, RequestConsultantPayoutDto, UpdateConsultantPayoutSettingsDto,
  AdminProcessConsultantPayoutDto, AdminMarkNoShowDto, AdminResolveDisputeDto,
  RescheduleBookingDto,
} from './dto/consultations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const ALLOWED_DOC_TYPES = [
  'hospitality_certificate', 'business_license', 'superhost_proof',
  'portfolio', 'other', 'national_id', 'profile_photo',
];

/** Per-type MIME whitelist — national_id and profile_photo must be images only */
const DOC_TYPE_MIME: Record<string, RegExp> = {
  national_id:              /\/(jpg|jpeg|png|webp)$/,
  profile_photo:            /\/(jpg|jpeg|png|webp)$/,
  hospitality_certificate:  /\/(jpg|jpeg|png|webp|pdf)$/,
  business_license:         /\/(jpg|jpeg|png|webp|pdf)$/,
  superhost_proof:          /\/(jpg|jpeg|png|webp|pdf)$/,
  portfolio:                /\/(jpg|jpeg|png|webp|gif|pdf)$/,
  other:                    /\/(jpg|jpeg|png|webp|gif|pdf)$/,
};

const docFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  // Accept any image or PDF at the multer stage;
  // per-type enforcement happens in the handler after documentTypes is parsed.
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|pdf)$/)) {
    return cb(new BadRequestException('Only image and PDF files are allowed'), false);
  }
  cb(null, true);
};

// ═══════════════════════════════════════════════════════════
//  PUBLIC — Browse consultants
// ═══════════════════════════════════════════════════════════

@ApiTags('consultations')
@Controller('consultations')
export class ConsultationsPublicController {
  constructor(private readonly svc: ConsultationsService) {}

  @Get('consultants')
  @ApiOperation({ summary: 'Browse approved consultants' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'specialization', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listConsultants(
    @Query('search') search?: string,
    @Query('specialization') specialization?: string,
    @Query('minRating') minRating?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listConsultants({
      search,
      specialization,
      minRating: minRating ? Number(minRating) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('consultants/:id/slots')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get available time slots for a consultant on a specific date' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'durationMinutes', required: true })
  @ApiQuery({ name: 'clientTimezone', required: false, description: 'IANA timezone string e.g. Africa/Cairo' })
  getConsultantSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
    @Query('durationMinutes') durationMinutes: string,
    @Query('clientTimezone') clientTimezone?: string,
  ) {
    return this.svc.getAvailableSlots(id, date, Number(durationMinutes), clientTimezone);
  }

  @Get('consultants/:id')
  @ApiOperation({ summary: 'Get consultant public profile with services, reviews & availability' })
  getConsultant(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getConsultantPublicProfile(id);
  }

}

// ═══════════════════════════════════════════════════════════
//  AUTHENTICATED — Consultant management & booking
// ═══════════════════════════════════════════════════════════

@ApiTags('consultations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consultations')
export class ConsultationsAuthController {
  constructor(private readonly svc: ConsultationsService) {}

  // ── Consultant Application ──
  @Post('apply')
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @ApiOperation({ summary: 'Apply to become a consultant' })
  apply(@CurrentUser() user: UserEntity, @Body() dto: ApplyAsConsultantDto) {
    return this.svc.applyAsConsultant(user.id, dto);
  }

  @Get('my-profile')
  @ApiOperation({ summary: 'Get my consultant profile' })
  getMyProfile(@CurrentUser() user: UserEntity) {
    return this.svc.getMyConsultantProfile(user.id);
  }

  @Patch('my-profile')
  @ApiOperation({ summary: 'Update my consultant profile' })
  updateProfile(@CurrentUser() user: UserEntity, @Body() dto: UpdateConsultantProfileDto) {
    return this.svc.updateConsultantProfile(user.id, dto);
  }

  // ── Document Upload ──
  @Post('documents')
  @ApiOperation({ summary: 'Upload consultant documents (certificates, ID, portfolio, etc.)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'consultant-docs', String((req as any).user?.id || 'unknown'));
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `doc-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: docFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadDocuments(
    @CurrentUser() user: UserEntity,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('documentTypes') documentTypes?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const types: string[] = documentTypes
      ? (typeof documentTypes === 'string' ? JSON.parse(documentTypes) : documentTypes)
      : files.map(() => 'other');

    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = types[i] || 'other';
      if (!ALLOWED_DOC_TYPES.includes(docType)) {
        throw new BadRequestException(`Invalid document type: ${docType}`);
      }
      // Per-type MIME enforcement (S1)
      const allowedMime = DOC_TYPE_MIME[docType] ?? DOC_TYPE_MIME['other'];
      if (!file.mimetype.match(allowedMime)) {
        throw new BadRequestException(
          `File type "${file.mimetype}" is not allowed for document type "${docType}"`,
        );
      }
      const fileUrl = `/uploads/consultant-docs/${user.id}/${file.filename}`;
      const doc = await this.svc.uploadDocument(user.id, docType, fileUrl, file.originalname);
      results.push(doc);
    }
    return results;
  }

  // ── Availability ──
  @Post('availability')
  @ApiOperation({ summary: 'Set weekly availability slots' })
  setAvailability(@CurrentUser() user: UserEntity, @Body() dto: SetAvailabilityDto) {
    return this.svc.setAvailability(user.id, dto);
  }

  // ── C4: Vacation / Out-of-Office Blocking ──
  @Post('vacation')
  @ApiOperation({ summary: 'Block a date range as out-of-office' })
  blockVacation(@CurrentUser() user: UserEntity, @Body() dto: BlockVacationDto) {
    return this.svc.blockVacation(user.id, dto);
  }

  @Get('vacation')
  @ApiOperation({ summary: 'Get my vacation blocks' })
  getVacations(@CurrentUser() user: UserEntity) {
    return this.svc.getMyVacations(user.id);
  }

  @Delete('vacation/:id')
  @ApiOperation({ summary: 'Delete a vacation block' })
  deleteVacation(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.deleteVacation(user.id, id);
  }

  // ── Booking ──
  @Post('book')
  @ApiOperation({ summary: 'Book a consultation session' })
  bookConsultation(@CurrentUser() user: UserEntity, @Body() dto: BookConsultationDto) {
    return this.svc.bookConsultation(user.id, dto);
  }

  @Patch('bookings/:id/respond')
  @ApiOperation({ summary: 'Accept or decline a consultation booking (consultant only)' })
  respondToBooking(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondToBookingDto,
  ) {
    return this.svc.respondToBooking(user.id, id, dto);
  }

  @Patch('bookings/:id/complete')
  @ApiOperation({ summary: 'Mark a consultation as completed (consultant only)' })
  completeBooking(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteBookingDto,
  ) {
    return this.svc.completeBooking(user.id, id, dto);
  }

  @Patch('bookings/:id/start')
  @ApiOperation({ summary: 'Start a confirmed consultation session (consultant only)' })
  startSession(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.startSession(user.id, id);
  }

  @Patch('bookings/:id/cancel')
  @ApiOperation({ summary: 'Cancel a consultation booking' })
  cancelBooking(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.svc.cancelBooking(user.id, id, reason);
  }

  @Patch('bookings/:id/confirm-completion')
  @ApiOperation({ summary: 'Client confirms the consultation session took place (unlocks consultant payout)' })
  confirmCompletion(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.confirmCompletion(user.id, id);
  }

  // BUG-H4: Client reports an issue with a completed session
  @Post('bookings/:id/report-issue')
  @ApiOperation({ summary: 'Client reports that the consultation session did not happen or had issues (blocks payout)' })
  reportSessionIssue(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.svc.reportSessionIssue(user.id, id, reason);
  }

  @Patch('bookings/:id/mark-instapay-paid')
  @ApiOperation({ summary: '[DEPRECATED] Mark InstaPay paid — use admin verify-payment instead. Kept for backward compat.' })
  markInstapayPaid(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.markInstapayPaid(user.id, id);
  }

  @Post('bookings/:id/submit-instapay-proof')
  @ApiOperation({ summary: 'Submit InstaPay payment reference/proof for a consultation booking (client)' })
  submitInstapayProof(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reference: string; proofUrl?: string },
  ) {
    return this.svc.submitConsultationInstapayProof(user.id, id, body);
  }

  // P2: Upload payment proof screenshot for a booking
  @Post('bookings/:id/upload-payment-proof')
  @ApiOperation({ summary: 'Upload InstaPay payment proof screenshot (client)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'payments', 'consultation-proofs');
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `proof-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Only image files (jpg, png, webp) are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPaymentProof(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('reference') reference?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const proofUrl = `/uploads/payments/consultation-proofs/${file.filename}`;
    return this.svc.submitConsultationInstapayProof(user.id, id, {
      reference: reference ?? '',
      proofUrl,
    });
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get my bookings as a client (host seeking consultation)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyBookingsAsClient(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getMyBookingsAsClient(user.id, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Get('consultant-bookings')
  @ApiOperation({ summary: 'Get bookings for my consultation services (as consultant)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getConsultantBookings(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getMyBookingsAsConsultant(user.id, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  // ── Dashboard Stats ──
  @Get('my-stats')
  @ApiOperation({ summary: 'Get dashboard statistics for my consultant account' })
  getMyStats(@CurrentUser() user: UserEntity) {
    return this.svc.getConsultantStats(user.id);
  }

  // ── Reviews ──
  @Post('bookings/:id/review')
  @ApiOperation({ summary: 'Review a completed consultation session' })
  createReview(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateConsultationReviewDto,
  ) {
    return this.svc.createReview(user.id, id, dto);
  }

  @Patch('reviews/:id/reply')
  @ApiOperation({ summary: 'Reply to a consultation review (consultant only)' })
  replyToReview(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyToReviewDto,
  ) {
    return this.svc.replyToReview(user.id, id, dto);
  }

  // C7: Flag a review for admin attention
  @Post('reviews/:id/flag')
  @ApiOperation({ summary: 'Flag a consultation review for admin moderation' })
  flagReview(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.svc.flagReview(user.id, id, reason);
  }

  // ── C12: Payout endpoints ──
  @Get('earnings')
  @ApiOperation({ summary: 'Get my earnings summary and history' })
  getMyEarnings(@CurrentUser() user: UserEntity) {
    return this.svc.getMyEarnings(user.id);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get my payout requests' })
  getMyPayoutRequests(@CurrentUser() user: UserEntity) {
    return this.svc.getMyPayoutRequests(user.id);
  }

  @Post('payouts/request')
  @ApiOperation({ summary: 'Request a payout of available earnings' })
  requestPayout(@CurrentUser() user: UserEntity, @Body() dto: RequestConsultantPayoutDto) {
    return this.svc.requestPayout(user.id, dto);
  }

  @Patch('payout-settings')
  @ApiOperation({ summary: 'Save preferred payout method and account details' })
  updatePayoutSettings(@CurrentUser() user: UserEntity, @Body() dto: UpdateConsultantPayoutSettingsDto) {
    return this.svc.updatePayoutSettings(user.id, dto);
  }

  // MF-17: Bulk respond to multiple bookings
  @Patch('bookings/bulk-respond')
  @ApiOperation({ summary: 'Bulk accept or decline pending bookings (consultant only)' })
  bulkRespondBookings(
    @CurrentUser() user: UserEntity,
    @Body() body: { bookingIds: number[]; action: 'confirmed' | 'cancelled' },
  ) {
    return this.svc.bulkRespondBookings(user.id, body.bookingIds, body.action);
  }

  // MISS6: Reschedule a confirmed booking
  @Patch('bookings/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule a confirmed booking to a new time (client or consultant)' })
  rescheduleBooking(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.svc.rescheduleBooking(user.id, id, dto);
  }

  // MISS8: Get platform InstaPay details
  @Get('instapay-info')
  @ApiOperation({ summary: 'Get platform InstaPay transfer details for making payments' })
  getInstapayInfo() {
    return this.svc.getInstapayDetails();
  }

  // MF-18: Export earnings data as JSON (frontend generates CSV)
  @Get('earnings/export')
  @ApiOperation({ summary: 'Export my earnings data for CSV generation' })
  exportEarnings(@CurrentUser() user: UserEntity) {
    return this.svc.exportEarningsCSV(user.id);
  }
}

// ═══════════════════════════════════════════════════════════
//  ADMIN — Manage consultants & providers
// ═══════════════════════════════════════════════════════════

@ApiTags('admin-consultations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/consultations')
export class ConsultationsAdminController {
  constructor(private readonly svc: ConsultationsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get consultation marketplace stats' })
  getStats() {
    return this.svc.adminGetStats();
  }

  // MISS7: Revenue dashboard
  @Get('revenue')
  @ApiOperation({ summary: 'Get detailed consultation revenue stats (fees, payouts, refunds, monthly breakdown)' })
  getRevenueStats() {
    return this.svc.adminGetRevenueStats();
  }

  @Get('consultants')
  @ApiOperation({ summary: 'List all consultants (pending/approved/rejected)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listConsultants(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.adminListConsultants({
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('consultants/:id')
  @ApiOperation({ summary: 'Get consultant detail with documents, availability & stats' })
  getConsultant(@Param('id', ParseIntPipe) id: number) {
    return this.svc.adminGetConsultantDetail(id);
  }

  @Patch('consultants/:id')
  @ApiOperation({ summary: 'Admin: update consultant profile, status, or featured flag' })
  updateConsultant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.svc.adminUpdateConsultant(id, dto);
  }

  @Get('consultants/:id/bookings')
  @ApiOperation({ summary: 'Admin: list bookings for a specific consultant' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  getConsultantBookings(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.adminGetConsultantBookings(id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
    });
  }

  @Patch('consultants/:id/review')
  @ApiOperation({ summary: 'Approve or reject a consultant application' })
  reviewConsultant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminReviewConsultantDto,
  ) {
    return this.svc.adminReviewConsultant(id, dto);
  }

  // C8: Consultation review moderation
  @Get('reviews')
  @ApiOperation({ summary: 'Admin: list all consultation reviews' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getConsultationReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.adminGetConsultationReviews(page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Patch('reviews/:id/hide')
  @ApiOperation({ summary: 'Admin: toggle consultation review visibility (hide/unhide)' })
  toggleConsultationReviewHidden(@Param('id', ParseIntPipe) id: number) {
    return this.svc.adminToggleReviewHidden(id);
  }

  // ── C12: Admin payout management ──
  @Get('payouts')
  @ApiOperation({ summary: 'Admin: list all consultant payout requests' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'status', required: false })
  adminListPayouts(
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.adminListConsultantPayouts({ page: page ? Number(page) : 1, status });
  }

  @Patch('payouts/:id')
  @ApiOperation({ summary: 'Admin: process (approve/reject) a consultant payout request' })
  adminProcessPayout(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminProcessConsultantPayoutDto,
  ) {
    return this.svc.adminProcessConsultantPayout(id, dto);
  }

  // BUG-M1: Mark a booking as no-show with party identification
  @Patch('bookings/:id/no-show')
  @ApiOperation({ summary: 'Admin: mark a booking as no-show (specify which party)' })
  markNoShow(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminMarkNoShowDto,
  ) {
    return this.svc.markNoShow(id, dto);
  }

  // BE-20: Mark a booking as disputed
  @Patch('bookings/:id/dispute')
  @ApiOperation({ summary: 'Admin: mark a booking as disputed' })
  markDisputed(@Param('id', ParseIntPipe) id: number) {
    return this.svc.markDisputed(id);
  }

  // BUG-M2: Resolve a disputed booking
  @Patch('bookings/:id/resolve-dispute')
  @ApiOperation({ summary: 'Admin: resolve a disputed booking (refund, pay consultant, or split)' })
  resolveDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminResolveDisputeDto,
  ) {
    return this.svc.adminResolveDispute(id, dto);
  }

  // REF1: Admin refund queue
  @Get('pending-refunds')
  @ApiOperation({ summary: 'Admin: list bookings with pending refunds' })
  @ApiQuery({ name: 'page', required: false })
  listPendingRefunds(@Query('page') page?: string) {
    return this.svc.adminListPendingRefunds({ page: page ? Number(page) : 1 });
  }

  // REF2: Admin process refund
  @Patch('bookings/:id/process-refund')
  @ApiOperation({ summary: 'Admin: mark a refund as completed (sent via InstaPay)' })
  processRefund(@Param('id', ParseIntPipe) id: number) {
    return this.svc.adminProcessRefund(id);
  }

  // BUG-H2: Admin payment verification queue
  @Get('pending-payments')
  @ApiOperation({ summary: 'Admin: list bookings with submitted InstaPay proof awaiting verification' })
  @ApiQuery({ name: 'page', required: false })
  listPendingPayments(@Query('page') page?: string) {
    return this.svc.adminListPendingPayments({ page: page ? Number(page) : 1 });
  }

  @Patch('bookings/:id/verify-payment')
  @ApiOperation({ summary: 'Admin: verify and approve an InstaPay payment' })
  verifyPayment(@Param('id', ParseIntPipe) id: number) {
    return this.svc.adminVerifyPayment(id);
  }
}
