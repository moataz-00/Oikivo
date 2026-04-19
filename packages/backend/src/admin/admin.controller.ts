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
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminActivityLogService } from './admin-activity-log.service';
import { AdminLogInterceptor } from './admin-log.interceptor';
import { AdminGuard } from './admin.guard';
import { AdminIpAllowlistGuard } from './admin-ip-allowlist.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DisputesService } from '../disputes/disputes.service';
import { ICalSyncService } from '../availability/ical-sync.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard, AdminIpAllowlistGuard)
@UseInterceptors(AdminLogInterceptor)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly disputesService: DisputesService,
    private readonly activityLogService: AdminActivityLogService,
    private readonly icalSyncService: ICalSyncService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (admin only)' })
  @ApiQuery({ name: 'from', required: false, description: 'Period start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'Period end date (YYYY-MM-DD)' })
  getDashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getDashboardStats(from, to);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'ahmed' })
  @ApiQuery({ name: 'idVerificationStatus', required: false, enum: ['pending', 'approved', 'rejected'] })
  getUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('idVerificationStatus') idVerificationStatus?: string,
  ) {
    return this.adminService.getUsers(
      parseInt(page) || 1,
      parseInt(limit) || 20,
      search,
      role,
      (sortBy as any) || 'createdAt',
      (sortOrder as any) || 'DESC',
      idVerificationStatus,
    );
  }

  @Patch('users/:id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status (admin only)' })
  toggleUserActive(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleUserActive(id);
  }

  @Patch('users/:id/toggle-admin')
  @ApiOperation({ summary: 'Toggle user admin role (admin only)' })
  toggleUserAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleUserAdmin(id);
  }

  @Patch('users/:id/review-id')
  @ApiOperation({ summary: 'Approve or reject a user ID document (admin only)' })
  reviewIdDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approved: boolean; rejectionReason?: string },
  ) {
    return this.adminService.reviewIdDocument(id, body.approved, body.rejectionReason);
  }

  @Post('users/bulk')
  @ApiOperation({ summary: 'Bulk action on users (admin only)' })
  bulkUserAction(
    @Body() body: { ids: number[]; action: 'activate' | 'deactivate' | 'grant_admin' | 'revoke_admin' },
  ) {
    return this.adminService.bulkUserAction(body.ids, body.action);
  }

  @Post('properties/bulk')
  @ApiOperation({ summary: 'Bulk update property status (admin only)' })
  bulkPropertyStatus(
    @Body() body: { ids: number[]; status: 'draft' | 'pending_review' | 'published' | 'archived' },
  ) {
    return this.adminService.bulkPropertyStatus(body.ids, body.status);
  }

  @Get('properties')
  @ApiOperation({ summary: 'Get all properties (admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'pending_review', 'published', 'archived'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getProperties(
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getProperties(status, parseInt(page) || 1, parseInt(limit) || 20, search);
  }

  @Patch('properties/:id/status')
  @ApiOperation({ summary: 'Update property status (admin only)' })
  togglePropertyStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'draft' | 'pending_review' | 'published' | 'archived' },
  ) {
    return this.adminService.togglePropertyStatus(id, body.status);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings (admin only)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  getBookings(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getBookings(parseInt(page) || 1, parseInt(limit) || 20, status, search);
  }

  @Post('bookings/:id/confirm-payment')
  @ApiOperation({ summary: 'Mark booking payment as paid (admin only)' })
  confirmPayment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.confirmPayment(id);
  }

  @Post('bookings/:id/decline-payment')
  @ApiOperation({ summary: 'Decline InstaPay payment (admin only)' })
  declinePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.declinePayment(id, body.reason);
  }

  @Get('payments/instapay-refunds-pending')
  @ApiOperation({ summary: 'List cancelled InstaPay bookings awaiting manual refund (admin only)' })
  getInstapayRefundsPending() {
    return this.adminService.getInstapayRefundsPending();
  }

  @Post('bookings/:id/mark-instapay-refunded')
  @ApiOperation({ summary: 'Mark a cancelled InstaPay booking refund as completed (admin only)' })
  markInstapayRefunded(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { reason?: string },
  ) {
    return this.adminService.markInstapayRefunded(id, body?.reason);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  getReviews(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getReviews(parseInt(page) || 1, parseInt(limit) || 20, search);
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete a review (admin only)' })
  deleteReview(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteReview(id);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get monthly revenue chart data (admin only)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRevenueChart(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getRevenueChart(from, to);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get all payout requests (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed'] })
  getPayouts(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getPayouts(parseInt(page) || 1, parseInt(limit) || 20, status);
  }

  @Patch('payouts/:id/process')
  @ApiOperation({ summary: 'Update payout status (admin only)' })
  processPayout(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'processing' | 'completed' | 'failed'; note?: string },
  ) {
    return this.adminService.processPayout(id, body.status, body.note);
  }

  // ─── Disputes ──────────────────────────────────────────────────────

  @Get('disputes')
  @ApiOperation({ summary: 'Get all disputes, optionally filtered by status' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  getDisputes(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.disputesService.getAllDisputes(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute with a resolution type and admin note' })
  resolveDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      resolution: 'resolved_for_guest' | 'resolved_for_host' | 'dismissed' | 'split';
      adminNote: string;
    },
  ) {
    return this.disputesService.resolveDispute(id, body.resolution, body.adminNote);
  }

  @Patch('disputes/:id/status')
  @ApiOperation({ summary: 'Update dispute status (e.g. mark as under_review)' })
  updateDisputeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'open' | 'under_review' | 'resolved' | 'closed' },
  ) {
    return this.disputesService.updateStatus(id, body.status);
  }

  // FIX AD2: Dispute assignment
  @Patch('disputes/:id/assign')
  @ApiOperation({ summary: 'Assign a dispute to an admin team member' })
  assignDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { assignedToId: number | null },
  ) {
    return this.disputesService.assignDispute(id, body.assignedToId);
  }

  // FIX AD2: Dispute priority
  @Patch('disputes/:id/priority')
  @ApiOperation({ summary: 'Set dispute priority level' })
  setDisputePriority(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { priority: 'low' | 'medium' | 'high' | 'critical' },
  ) {
    return this.disputesService.setDisputePriority(id, body.priority);
  }

  // FIX AD2: Dispute SLA deadline
  @Patch('disputes/:id/sla')
  @ApiOperation({ summary: 'Set dispute SLA deadline' })
  setDisputeSla(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { slaDeadline: string | null },
  ) {
    return this.disputesService.setDisputeSla(id, body.slaDeadline);
  }

  // ─── Experience Bookings ───────────────────────────────────────────────────

  @Get('experience-bookings')
  @ApiOperation({ summary: 'Get all experience bookings (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getExperienceBookings(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getExperienceBookings(parseInt(page) || 1, parseInt(limit) || 20, status, search);
  }

  @Patch('experience-bookings/:id/confirm-payment')
  @ApiOperation({ summary: 'Confirm experience booking payment (admin only)' })
  confirmExperiencePayment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.confirmExperiencePayment(id);
  }

  @Get('activity-log')
  @ApiOperation({ summary: 'Get admin activity log (admin only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'adminId', required: false })
  getActivityLog(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('adminId') adminId?: string,
  ) {
    return this.activityLogService.getAll(
      parseInt(page) || 1,
      parseInt(limit) || 50,
      adminId ? parseInt(adminId) : undefined,
    );
  }

  // ─── Platform Settings ─────────────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'Get all platform settings (admin only)' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings/:key')
  @ApiOperation({ summary: 'Update a platform setting by key (admin only)' })
  updateSetting(
    @Param('key') key: string,
    @Body() body: { value: string },
  ) {
    return this.adminService.updateSetting(key, body.value);
  }

  // ─── Analytics ──────────────────────────────────────────────────────

  @Get('analytics/enhanced')
  @ApiOperation({ summary: 'Get comprehensive analytics with detailed breakdowns (admin only)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getEnhancedAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getEnhancedAnalytics(from, to);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data with optional date range (admin only)' })
  @ApiQuery({ name: 'from', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2025-12-31' })
  getAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getAnalytics(from, to);
  }

  // ─── Notifications ──────────────────────────────────────────────────

  @Get('notifications')
  @ApiOperation({ summary: 'Get all system notifications (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getNotifications(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getNotificationHistory(parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Post('notifications/blast')
  @ApiOperation({ summary: 'Send a push notification blast to a user audience (admin only)' })
  sendNotificationBlast(
    @Body() body: { audience: 'all' | 'hosts' | 'guests'; type: string; title: string; message: string },
  ) {
    return this.adminService.sendNotificationBlast(
      body.audience ?? 'all',
      body.type ?? 'info',
      body.title,
      body.message,
    );
  }

  // ─── Badge Counts (lightweight nav indicators) ───────────────────────────

  @Get('badge-counts')
  @ApiOperation({ summary: 'Get lightweight badge counts for sidebar nav (admin only)' })
  getBadgeCounts() {
    return this.adminService.getBadgeCounts();
  }

  // ─── System Health ──────────────────────────────────────────────────

  @Get('system-health')
  @ApiOperation({ summary: 'Get backend system health status (admin only)' })
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  // ─── Email Blast ───────────────────────────────────────────────────────

  @Post('send-email-blast')
  @ApiOperation({ summary: 'Send a bulk email to a user audience (admin only)' })
  sendEmailBlast(
    @Body() body: { subject: string; body: string; audience: 'all' | 'hosts' | 'guests' },
  ) {
    return this.adminService.sendEmailBlast(body.subject, body.body, body.audience ?? 'all');
  }

  @Post('send-test-email')
  @ApiOperation({ summary: 'Send a test email to a specific address (admin only)' })
  sendTestEmail(
    @Body() body: { subject: string; body: string; recipientEmail: string },
    @Req() req: any,
  ) {
    return this.adminService.sendTestEmail(body.subject, body.body, body.recipientEmail ?? req.user?.email);
  }

  // ─── iCal Monitoring ──────────────────────────────────────────────────────

  @Get('ical-sources')
  @ApiOperation({ summary: 'Get all iCal feed sources across all properties (admin only)' })
  getIcalSources() {
    return this.icalSyncService.getSourcesAdmin();
  }

  @Post('ical-sources/:id/sync')
  @ApiOperation({ summary: 'Force-sync a specific iCal feed by ID (admin only)' })
  syncIcalSource(@Param('id', ParseIntPipe) id: number) {
    return this.icalSyncService.syncSourceById(id);
  }

  // ─── User Detail + CRUD ─────────────────────────────────────────────────────

  @Get('users/:id')
  @ApiOperation({ summary: 'Get full user detail with stats (admin only)' })
  getUserDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Edit user fields (admin only)' })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{
      firstName: string; lastName: string; email: string; phone: string;
      bio: string; isHost: boolean; isActive: boolean; isAdmin: boolean;
    }>,
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user with reason (admin only)' })
  banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ) {
    return this.adminService.banUser(id, body.reason);
  }

  // ─── Property Detail + CRUD ─────────────────────────────────────────────────

  @Get('properties/:id')
  @ApiOperation({ summary: 'Get full property detail with stats (admin only)' })
  getPropertyDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPropertyDetail(id);
  }

  @Patch('properties/:id')
  @ApiOperation({ summary: 'Edit property fields (admin only)' })
  updateProperty(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{
      title: string; description: string; pricePerNight: number;
      cleaningFee: number; status: string; maxGuests: number;
      bedrooms: number; bathrooms: number; beds: number;
      minNights: number; maxNights: number; city: string; country: string;
      cancellationPolicy: string; isActive: boolean;
    }>,
  ) {
    return this.adminService.updateProperty(id, body);
  }

  @Delete('properties/:id')
  @ApiOperation({ summary: 'Delete a property (admin only)' })
  deleteProperty(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteProperty(id);
  }

  // ─── Booking Detail + Admin Actions ─────────────────────────────────────────

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get full booking detail (admin only)' })
  getBookingDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getBookingDetail(id);
  }

  @Patch('bookings/:id')
  @ApiOperation({ summary: 'Edit booking fields (admin only)' })
  updateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{
      status: string; paymentStatus: string; paymentNote: string;
      guestNote: string; specialRequests: string;
    }>,
  ) {
    return this.adminService.updateBooking(id, body);
  }

  @Post('bookings/:id/admin-cancel')
  @ApiOperation({ summary: 'Admin force-cancel a booking (admin only)' })
  adminCancelBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ) {
    return this.adminService.adminCancelBooking(id, body.reason);
  }

  @Post('bookings/:id/admin-refund')
  @ApiOperation({ summary: 'Admin issue manual refund (admin only)' })
  adminRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.adminService.adminRefund(id, body.amount, body.reason);
  }

  // ─── Categories CRUD ───────────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories (admin only)' })
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category (admin only)' })
  createCategory(@Body() body: { name: string; nameAr: string; icon: string; description?: string; sortOrder?: number }) {
    return this.adminService.createCategory(body);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category (admin only)' })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{ name: string; nameAr: string; icon: string; description: string; sortOrder: number; isActive: boolean }>,
  ) {
    return this.adminService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteCategory(id);
  }

  // ─── Amenities CRUD ───────────────────────────────────────────────────────

  @Get('amenities')
  @ApiOperation({ summary: 'Get all amenities (admin only)' })
  getAmenities() {
    return this.adminService.getAmenities();
  }

  @Post('amenities')
  @ApiOperation({ summary: 'Create an amenity (admin only)' })
  createAmenity(@Body() body: { name: string; nameAr: string; icon: string; category?: string; sortOrder?: number }) {
    return this.adminService.createAmenity(body);
  }

  @Patch('amenities/:id')
  @ApiOperation({ summary: 'Update an amenity (admin only)' })
  updateAmenity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{ name: string; nameAr: string; icon: string; category: string; sortOrder: number }>,
  ) {
    return this.adminService.updateAmenity(id, body);
  }

  @Delete('amenities/:id')
  @ApiOperation({ summary: 'Delete an amenity (admin only)' })
  deleteAmenity(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteAmenity(id);
  }

  // ─── Consultant Detail ─────────────────────────────────────────────────────

  @Get('consultants/:id')
  @ApiOperation({ summary: 'Get full consultant detail with stats (admin only)' })
  getConsultantDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getConsultantDetail(id);
  }

  // ─── Create User ───────────────────────────────────────────────────────────

  @Post('users')
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  createUser(
    @Body() body: { firstName: string; lastName: string; email: string; password: string; phone?: string; isHost?: boolean; isAdmin?: boolean },
  ) {
    return this.adminService.createUser(body);
  }

  // ─── Adjust Booking Amounts ────────────────────────────────────────────────

  @Patch('bookings/:id/adjust-amounts')
  @ApiOperation({ summary: 'Adjust pricing on an existing booking (admin only)' })
  adjustBookingAmounts(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { baseAmount?: number; cleaningFee?: number; serviceFee?: number; totalAmount?: number; reason: string },
  ) {
    return this.adminService.adjustBookingAmounts(id, body);
  }

  // ─── Featured Properties ───────────────────────────────────────────────────

  @Patch('properties/:id/featured')
  @ApiOperation({ summary: 'Toggle featured status for a property (admin only)' })
  toggleFeatured(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleFeatured(id);
  }

  // ─── Commission Override ───────────────────────────────────────────────────

  @Patch('properties/:id/commission')
  @ApiOperation({ summary: 'Override commission (service fee %) for a property (admin only)' })
  updateCommission(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { serviceFeePercent: number },
  ) {
    return this.adminService.updateCommission(id, body.serviceFeePercent);
  }

  // ─── Flag Review ───────────────────────────────────────────────────────────

  @Patch('reviews/:id/flag')
  @ApiOperation({ summary: 'Flag or unflag a review (admin only)' })
  flagReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { flagged: boolean; adminNote?: string },
  ) {
    return this.adminService.flagReview(id, body.flagged, body.adminNote);
  }

  // ─── Individual User Notification ──────────────────────────────────────────

  @Post('users/:id/notify')
  @ApiOperation({ summary: 'Send notification to a specific user (admin only)' })
  sendUserNotification(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title: string; message: string },
  ) {
    return this.adminService.sendUserNotification(id, body.title, body.message);
  }

  // ─── User Activity Timeline ────────────────────────────────────────────────

  @Get('users/:id/timeline')
  @ApiOperation({ summary: 'Get user activity timeline (admin only)' })
  getUserTimeline(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserActivityTimeline(id);
  }

  // ─── Message Threads ───────────────────────────────────────────────────────

  @Get('messages')
  @ApiOperation({ summary: 'List all conversations (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  getConversations(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getConversations(parseInt(page) || 1, parseInt(limit) || 20, search);
  }

  @Get('messages/:id')
  @ApiOperation({ summary: 'Get conversation messages (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getConversationMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.adminService.getConversationMessages(id, parseInt(page) || 1, parseInt(limit) || 50);
  }

  // ─── Data Export ───────────────────────────────────────────────────────────

  @Get('export/:type')
  @ApiOperation({ summary: 'Export dataset by type with pagination (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getExportData(
    @Param('type') type: 'bookings' | 'users' | 'properties' | 'payouts' | 'reviews' | 'disputes',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getExportData(type, page || 1, limit || 5000);
  }

  // ─── Experience Booking Detail ─────────────────────────────────────────────

  @Get('experience-bookings/:id')
  @ApiOperation({ summary: 'Get full experience booking detail (admin only)' })
  getExperienceBookingDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getExperienceBookingDetail(id);
  }

  // ─── Batch Process Payouts ─────────────────────────────────────────────────

  @Post('payouts/batch-process')
  @ApiOperation({ summary: 'Batch process multiple payouts (admin only)' })
  batchProcessPayouts(
    @Body() body: { ids: number[]; status: 'processing' | 'completed' | 'failed'; note?: string },
  ) {
    return this.adminService.batchProcessPayouts(body.ids, body.status, body.note);
  }

  // ─── Email Templates ─────────────────────────────────────────────────────────

  @Get('email-templates')
  @ApiOperation({ summary: 'List all email templates (admin only)' })
  getEmailTemplates() {
    return this.adminService.getEmailTemplates();
  }

  @Get('email-templates/:slug')
  @ApiOperation({ summary: 'Preview an email template with sample data (admin only)' })
  previewEmailTemplate(@Param('slug') slug: string) {
    return this.adminService.previewEmailTemplate(slug);
  }

  // ─── Financial Analytics ──────────────────────────────────────────────────

  @Get('analytics/financial')
  @ApiOperation({ summary: 'Get financial analytics with profit tracking (admin only)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getFinancialAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getFinancialAnalytics(from, to);
  }

  @Get('bookings/:id/profit')
  @ApiOperation({ summary: 'Get per-booking profit breakdown (admin only)' })
  getBookingProfit(@Param('id') id: string) {
    return this.adminService.getBookingProfit(parseInt(id));
  }

  // ─── Expenses ─────────────────────────────────────────────────────────────

  @Get('expenses')
  @ApiOperation({ summary: 'List expenses (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getExpenses(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.getExpenses(parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Create an expense entry (admin only)' })
  createExpense(@Body() body: { description: string; amount: number; category?: string; date: string }, @Req() req: any) {
    return this.adminService.createExpense({ ...body, addedBy: req.user?.id });
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update an expense entry (admin only)' })
  updateExpense(@Param('id') id: string, @Body() body: { description?: string; amount?: number; category?: string; date?: string }) {
    return this.adminService.updateExpense(parseInt(id), body);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense entry (admin only)' })
  deleteExpense(@Param('id') id: string) {
    return this.adminService.deleteExpense(parseInt(id));
  }

  // ─── FIX AD1: Payment Transactions ────────────────────────────────────────

  @Get('payments/transactions')
  @ApiOperation({ summary: 'List all payment transactions across gateways (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'search', required: false })
  getPaymentTransactions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('method') method?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getPaymentTransactions(
      parseInt(page) || 1,
      parseInt(limit) || 20,
      { method, status, from, to, search },
    );
  }

  // ─── FIX AD7: User Merge ──────────────────────────────────────────────────

  @Get('users/duplicates')
  @ApiOperation({ summary: 'Find potential duplicate users (admin only)' })
  @ApiQuery({ name: 'search', required: true })
  findDuplicateUsers(@Query('search') search: string) {
    return this.adminService.findDuplicateUsers(search);
  }

  @Post('users/merge')
  @ApiOperation({ summary: 'Merge two user accounts (admin only)' })
  mergeUsers(@Body() body: { keepId: number; mergeId: number }, @Req() req: any) {
    return this.adminService.mergeUsers(body.keepId, body.mergeId, req.user?.id);
  }

  // ─── FIX AD9: Notification Templates ──────────────────────────────────────

  @Get('notification-templates')
  @ApiOperation({ summary: 'List all push/SMS notification templates (admin only)' })
  getNotificationTemplates() {
    return this.adminService.getNotificationTemplates();
  }

  @Patch('notification-templates/:slug')
  @ApiOperation({ summary: 'Update a notification template (admin only)' })
  updateNotificationTemplate(
    @Param('slug') slug: string,
    @Body() body: { title?: string; body?: string; enabled?: boolean },
  ) {
    return this.adminService.updateNotificationTemplate(slug, body);
  }

  // ─── FIX AD11: Host Onboarding Funnel ─────────────────────────────────────

  @Get('host-onboarding')
  @ApiOperation({ summary: 'Get host onboarding funnel stats (admin only)' })
  getHostOnboardingFunnel() {
    return this.adminService.getHostOnboardingFunnel();
  }
}
