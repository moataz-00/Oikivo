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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminActivityLogService } from './admin-activity-log.service';
import { AdminLogInterceptor } from './admin-log.interceptor';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DisputesService } from '../disputes/disputes.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminLogInterceptor)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly disputesService: DisputesService,
    private readonly activityLogService: AdminActivityLogService,
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
  getUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(parseInt(page) || 1, parseInt(limit) || 20, search, role);
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
    @Body() body: { approved: boolean },
  ) {
    return this.adminService.reviewIdDocument(id, body.approved);
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
  getRevenueChart() {
    return this.adminService.getRevenueChart();
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
  getDisputes(@Query('status') status?: string) {
    return this.disputesService.getAllDisputes(status);
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
}
