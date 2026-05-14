import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Resolves a relative /uploads/... path to the full backend URL */
export const BACKEND_BASE = API_URL.replace(/\/api$/, '');
export function getUploadUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND_BASE}${path}`;
}

// ─── Shared response types ────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
}

export interface DashboardStats {
  users: { total: number; hosts: number; guests: number; newThisMonth: number; newThisWeek: number };
  properties: { total: number; published: number; draft: number; archived: number };
  bookings: {
    total: number; pending: number; confirmed: number; completed: number;
    cancelled: number; todayCheckIns: number; todayCheckOuts: number;
  };
  revenue: { total: number; thisMonth: number; thisWeek: number };
  pendingActions: {
    openDisputes: number; pendingPayouts: number;
    pendingIdVerifications: number; pendingInstapayRefunds: number;
  };
  period?: { newUsers: number; bookings: number; confirmedBookings: number; revenue: number };
  recentBookings: Array<{
    id: number; status: string; totalAmount: number;
    guest?: { firstName: string; lastName: string };
    property?: { title: string };
  }>;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send httpOnly cookie for admin auth
});

apiClient.interceptors.request.use((config) => {
  // CSRF mitigation: custom header blocks cross-origin form/script submissions
  config.headers['X-Admin-Request'] = '1';
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Try to refresh the token once on 401 before redirecting to login
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const originalRequest = err.config;
      // Avoid infinite loop — don't retry the refresh endpoint itself
      if (!originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
        originalRequest._retry = true;
        try {
          await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
          return apiClient(originalRequest);
        } catch {
          // Refresh failed — clear session and send to login
          localStorage.removeItem('admin_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data),
};

// ─── Admin ─────────────────────────────────────────────────────────────────────
export interface ICalSourceAdmin {
  id: number;
  propertyId: number;
  property?: { id: number; title: string; hostId: number };
  label: string;
  url: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export const adminApi = {
  getDashboard: (params?: { from?: string; to?: string }): Promise<DashboardStats> =>
    apiClient.get<DashboardStats>('/admin/dashboard', { params }).then((r) => r.data),

  getRevenueChart: (params?: { from?: string; to?: string }) =>
    apiClient.get('/admin/revenue-chart', { params }).then((r) => r.data),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; sortBy?: string; sortOrder?: string; idVerificationStatus?: string }) =>
    apiClient.get('/admin/users', { params }).then((r) => r.data),

  getUserDetail: (id: number) =>
    apiClient.get(`/admin/users/${id}`).then((r) => r.data),

  getUserByUuid: (uuid: string) =>
    apiClient.get(`/admin/users/by-uuid/${uuid}`).then((r) => r.data),

  updateUser: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/users/${id}`, data).then((r) => r.data),

  deleteUser: (id: number, reason?: string) =>
    apiClient.delete(`/admin/users/${id}`, { data: { reason } }).then((r) => r.data),

  banUser: (id: number, reason: string) =>
    apiClient.patch(`/admin/users/${id}/ban`, { reason }).then((r) => r.data),

  suspendUser: (id: number, reason: string) =>
    apiClient.patch(`/admin/users/${id}/suspend`, { reason }).then((r) => r.data),

  toggleUserActive: (id: number) =>
    apiClient.patch(`/admin/users/${id}/toggle-active`).then((r) => r.data),

  toggleUserAdmin: (id: number) =>
    apiClient.patch(`/admin/users/${id}/toggle-admin`).then((r) => r.data),

  // Properties (by ID — legacy)
  getProperties: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get('/admin/properties', { params }).then((r) => r.data),

  getPropertyDetail: (id: number) =>
    apiClient.get(`/admin/properties/${id}`).then((r) => r.data),

  updateProperty: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/properties/${id}`, data).then((r) => r.data),

  deleteProperty: (id: number) =>
    apiClient.delete(`/admin/properties/${id}`).then((r) => r.data),

  updatePropertyStatus: (id: number, status: 'draft' | 'published' | 'archived') =>
    apiClient.patch(`/admin/properties/${id}/status`, { status }).then((r) => r.data),

  // Properties (by UUID — secure)
  getPropertyByUuid: (uuid: string) =>
    apiClient.get(`/admin/properties/by-uuid/${uuid}`).then((r) => r.data),

  updatePropertyByUuid: (uuid: string, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/properties/by-uuid/${uuid}`, data).then((r) => r.data),

  deletePropertyByUuid: (uuid: string) =>
    apiClient.delete(`/admin/properties/by-uuid/${uuid}`).then((r) => r.data),

  updatePropertyStatusByUuid: (uuid: string, status: 'draft' | 'published' | 'archived' | 'pending_review') =>
    apiClient.patch(`/admin/properties/by-uuid/${uuid}/status`, { status }).then((r) => r.data),

  toggleFeaturedByUuid: (uuid: string) =>
    apiClient.patch(`/admin/properties/by-uuid/${uuid}/featured`).then((r) => r.data),

  updateCommissionByUuid: (uuid: string, serviceFeePercent: number) =>
    apiClient.patch(`/admin/properties/by-uuid/${uuid}/commission`, { serviceFeePercent }).then((r) => r.data),

  // Bookings (list + legacy numeric-ID actions still used by list page inline actions)
  getBookings: (params?: { page?: number; limit?: number; status?: string; search?: string; from?: string; to?: string }): Promise<PaginatedResponse<any>> =>
    apiClient.get<PaginatedResponse<any>>('/admin/bookings', { params }).then((r) => r.data),

  getBookingDetail: (id: number) =>
    apiClient.get(`/admin/bookings/${id}`).then((r) => r.data),

  confirmPayment: (id: number) =>
    apiClient.post(`/admin/bookings/${id}/confirm-payment`).then((r) => r.data),

  declinePayment: (id: number, reason?: string) =>
    apiClient.post(`/admin/bookings/${id}/decline-payment`, { reason }).then((r) => r.data),

  getDepositClaims: (status?: string) =>
    apiClient.get('/admin/deposit-claims', { params: status ? { status } : undefined }).then((r) => r.data),

  // Bookings — UUID-based (detail page)
  getBookingDetailByUuid: (uuid: string) =>
    apiClient.get(`/admin/bookings/by-uuid/${uuid}`).then((r) => r.data),

  updateBookingByUuid: (uuid: string, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/bookings/by-uuid/${uuid}`, data).then((r) => r.data),

  adminCancelBookingByUuid: (uuid: string, reason: string) =>
    apiClient.post(`/admin/bookings/by-uuid/${uuid}/admin-cancel`, { reason }).then((r) => r.data),

  adminRefundByUuid: (uuid: string, amount: number, reason: string) =>
    apiClient.post(`/admin/bookings/by-uuid/${uuid}/admin-refund`, { amount, reason }).then((r) => r.data),

  approveDepositClaimByUuid: (uuid: string, adminNote?: string) =>
    apiClient.post(`/admin/bookings/by-uuid/${uuid}/deposit/approve`, { adminNote }).then((r) => r.data),

  rejectDepositClaimByUuid: (uuid: string, reason?: string) =>
    apiClient.post(`/admin/bookings/by-uuid/${uuid}/deposit/reject`, { reason }).then((r) => r.data),

  adjustBookingAmountsByUuid: (uuid: string, data: { baseAmount?: number; cleaningFee?: number; serviceFee?: number; totalAmount?: number; reason: string }) =>
    apiClient.patch(`/admin/bookings/by-uuid/${uuid}/adjust-amounts`, data).then((r) => r.data),

  getBookingProfitByUuid: (uuid: string) =>
    apiClient.get(`/admin/bookings/by-uuid/${uuid}/profit`).then((r) => r.data),

  markProofViewedByUuid: (uuid: string) =>
    apiClient.patch(`/admin/bookings/by-uuid/${uuid}/mark-proof-viewed`).then((r) => r.data),

  confirmPaymentByUuid: (uuid: string) =>
    apiClient.post(`/admin/bookings/by-uuid/${uuid}/confirm-payment`).then((r) => r.data),

  declinePaymentByUuid: (uuid: string, reason?: string) =>
    apiClient.post(`/admin/bookings/by-uuid/${uuid}/decline-payment`, { reason }).then((r) => r.data),

  markInstapayRefundedByUuid: (uuid: string, reason?: string) =>
    apiClient.post(`/admin/bookings/by-uuid/${uuid}/mark-instapay-refunded`, { reason }).then((r) => r.data),

  // Legacy numeric-ID versions (kept for backward compat)
  updateBooking: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/bookings/${id}`, data).then((r) => r.data),

  adminCancelBooking: (id: number, reason: string) =>
    apiClient.post(`/admin/bookings/${id}/admin-cancel`, { reason }).then((r) => r.data),

  adminRefund: (id: number, amount: number, reason: string) =>
    apiClient.post(`/admin/bookings/${id}/admin-refund`, { amount, reason }).then((r) => r.data),

  approveDepositClaim: (id: number, adminNote?: string) =>
    apiClient.post(`/admin/bookings/${id}/deposit/approve`, { adminNote }).then((r) => r.data),

  rejectDepositClaim: (id: number, reason?: string) =>
    apiClient.post(`/admin/bookings/${id}/deposit/reject`, { reason }).then((r) => r.data),

  markProofViewed: (id: number) =>
    apiClient.patch(`/admin/bookings/${id}/mark-proof-viewed`).then((r) => r.data),

  // Reviews
  getReviews: (params?: { page?: number; limit?: number; search?: string; rating?: number }) =>
    apiClient.get('/admin/reviews', { params }).then((r) => r.data),

  deleteReview: (id: number) =>
    apiClient.delete(`/admin/reviews/${id}`).then((r) => r.data),

  // ID Verification
  reviewIdDocument: (id: number, approved: boolean, rejectionReason?: string) =>
    apiClient.patch(`/admin/users/${id}/review-id`, { approved, rejectionReason }).then((r) => r.data),

  // Bulk actions
  bulkUserAction: (ids: number[], action: 'activate' | 'deactivate' | 'grant_admin' | 'revoke_admin') =>
    apiClient.post('/admin/users/bulk', { ids, action }).then((r) => r.data),

  bulkPropertyStatus: (ids: number[], status: 'draft' | 'published' | 'archived') =>
    apiClient.post('/admin/properties/bulk', { ids, status }).then((r) => r.data),

  // Activity Log
  getActivityLog: (params?: { page?: number; limit?: number; adminId?: number; method?: string; from?: string; to?: string }) =>
    apiClient.get('/admin/activity-log', { params }).then((r) => r.data),

  // Payouts
  getPayouts: (params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<PaginatedResponse<any>> =>
    apiClient.get<PaginatedResponse<any>>('/admin/payouts', { params }).then((r) => r.data),

  processPayout: (id: number, status: 'processing' | 'completed' | 'failed', note?: string) =>
    apiClient.patch(`/admin/payouts/${id}/process`, { status, note }).then((r) => r.data),

  // Disputes
  getDisputes: (params?: { status?: string; page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> =>
    apiClient.get<PaginatedResponse<any>>('/admin/disputes', { params }).then((r) => r.data),

  resolveDispute: (id: number, resolution: string, adminNote: string) =>
    apiClient.patch(`/admin/disputes/${id}/resolve`, { resolution, adminNote }).then((r) => r.data),

  updateDisputeStatus: (id: number, status: string) =>
    apiClient.patch(`/admin/disputes/${id}/status`, { status }).then((r) => r.data),

  // InstaPay refunds awaiting manual transfer
  getInstapayRefundsPending: () =>
    apiClient.get('/admin/payments/instapay-refunds-pending').then((r) => r.data),

  markInstapayRefunded: (id: number) =>
    apiClient.post(`/admin/bookings/${id}/mark-instapay-refunded`).then((r) => r.data),

  // Experience Bookings (admin)
  getExperienceBookings: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get('/admin/experience-bookings', { params }).then((r) => r.data),

  confirmExpBookingPayment: (id: number) =>
    apiClient.patch(`/admin/experience-bookings/${id}/confirm-payment`).then((r) => r.data),

  // Platform Settings
  getSettings: () =>
    apiClient.get('/admin/settings').then((r) => r.data),

  updateSetting: (key: string, value: string) =>
    apiClient.patch(`/admin/settings/${key}`, { value }).then((r) => r.data),

  // Badge counts (lightweight nav indicators)
  getBadgeCounts: () =>
    apiClient.get('/admin/badge-counts').then((r) => r.data),

  // Admin cookie logout
  adminLogout: () =>
    apiClient.post('/auth/admin-logout').then((r) => r.data),

  // Analytics
  getAnalytics: (params?: { from?: string; to?: string }) =>
    apiClient.get('/admin/analytics', { params }).then((r) => r.data),

  // Notification history
  getNotificationsHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/admin/notifications', { params }).then((r) => r.data),

  // System Health
  getSystemHealth: () =>
    apiClient.get('/admin/system-health').then((r) => r.data),

  // Notifications blast
  sendNotificationBlast: (payload: { title: string; message: string; audience: string; type: string }) =>
    apiClient.post('/admin/notifications/blast', payload).then((r) => r.data),

  // Email blast
  sendEmailBlast: (payload: { subject: string; body: string; audience: 'all' | 'hosts' | 'guests' }) =>
    apiClient.post('/admin/send-email-blast', payload).then((r) => r.data),

  sendTestEmail: (payload: { subject: string; body: string; recipientEmail: string }) =>
    apiClient.post('/admin/send-test-email', payload).then((r) => r.data),

  // Consultations
  getConsultationStats: () =>
    apiClient.get('/admin/consultations/stats').then((r) => r.data),

  getConsultants: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/admin/consultations/consultants', { params }).then((r) => r.data),

  getConsultantDetail: (id: number) =>
    apiClient.get(`/admin/consultations/consultants/${id}`).then((r) => r.data),

  updateConsultant: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/consultations/consultants/${id}`, data).then((r) => r.data),

  getConsultantBookings: (id: number, params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get(`/admin/consultations/consultants/${id}/bookings`, { params }).then((r) => r.data),

  reviewConsultant: (id: number, decision: string, rejectionReason?: string) =>
    apiClient.patch(`/admin/consultations/consultants/${id}/review`, { decision, rejectionReason }).then((r) => r.data),

  // Categories
  getCategories: () =>
    apiClient.get('/admin/categories').then((r) => r.data),

  createCategory: (data: { name: string; nameAr: string; icon: string; description?: string; sortOrder?: number }) =>
    apiClient.post('/admin/categories', data).then((r) => r.data),

  updateCategory: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: number) =>
    apiClient.delete(`/admin/categories/${id}`).then((r) => r.data),

  // Amenities
  getAmenities: () =>
    apiClient.get('/admin/amenities').then((r) => r.data),

  createAmenity: (data: { name: string; nameAr: string; icon: string; category?: string; sortOrder?: number }) =>
    apiClient.post('/admin/amenities', data).then((r) => r.data),

  updateAmenity: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/amenities/${id}`, data).then((r) => r.data),

  deleteAmenity: (id: number) =>
    apiClient.delete(`/admin/amenities/${id}`).then((r) => r.data),

  // Enhanced Analytics
  getEnhancedAnalytics: (params?: { from?: string; to?: string }) =>
    apiClient.get('/admin/analytics/enhanced', { params }).then((r) => r.data),

  // iCal Monitoring
  getIcalSources: () =>
    apiClient.get('/admin/ical-sources').then((r) => r.data as ICalSourceAdmin[]),

  syncIcalSource: (id: number) =>
    apiClient.post(`/admin/ical-sources/${id}/sync`).then((r) => r.data as ICalSourceAdmin),

  // ─── New Admin Features ─────────────────────────────────────────────────

  // Create user
  createUser: (data: { firstName: string; lastName: string; email: string; password: string; phone?: string; isHost?: boolean; isAdmin?: boolean }) =>
    apiClient.post('/admin/users', data).then((r) => r.data),

  // Adjust booking amounts
  adjustBookingAmounts: (id: number, data: { baseAmount?: number; cleaningFee?: number; serviceFee?: number; totalAmount?: number; reason: string }) =>
    apiClient.patch(`/admin/bookings/${id}/adjust-amounts`, data).then((r) => r.data),

  // Featured property
  toggleFeatured: (id: number) =>
    apiClient.patch(`/admin/properties/${id}/featured`).then((r) => r.data),

  // Commission override
  updateCommission: (id: number, serviceFeePercent: number) =>
    apiClient.patch(`/admin/properties/${id}/commission`, { serviceFeePercent }).then((r) => r.data),

  // Flag review
  flagReview: (id: number, flagged: boolean, adminNote?: string) =>
    apiClient.patch(`/admin/reviews/${id}/flag`, { flagged, adminNote }).then((r) => r.data),

  // Individual user notification
  sendUserNotification: (id: number, title: string, message: string) =>
    apiClient.post(`/admin/users/${id}/notify`, { title, message }).then((r) => r.data),

  // User activity timeline
  getUserTimeline: (id: number) =>
    apiClient.get(`/admin/users/${id}/timeline`).then((r) => r.data),

  // Message threads
  getConversations: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/admin/messages', { params }).then((r) => r.data),

  getConversationMessages: (id: number, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/admin/messages/${id}`, { params }).then((r) => r.data),

  deleteConversation: (id: number) =>
    apiClient.delete(`/admin/messages/${id}`).then((r) => r.data),

  deleteMessage: (id: number) =>
    apiClient.delete(`/admin/messages/message/${id}`).then((r) => r.data),

  // Data export (full dataset)
  getExportData: (type: string) =>
    apiClient.get(`/admin/export/${type}`).then((r) => r.data),

  // Experience booking detail
  getExperienceBookingDetail: (id: number) =>
    apiClient.get(`/admin/experience-bookings/${id}`).then((r) => r.data),

  // Batch process payouts
  batchProcessPayouts: (ids: number[], status: 'processing' | 'completed' | 'failed', note?: string) =>
    apiClient.post('/admin/payouts/batch-process', { ids, status, note }).then((r) => r.data),

  // Email templates
  getEmailTemplates: () =>
    apiClient.get('/admin/email-templates').then((r) => r.data),

  previewEmailTemplate: (slug: string) =>
    apiClient.get(`/admin/email-templates/${slug}`).then((r) => r.data),

  // Financial analytics
  getFinancialAnalytics: (params?: { from?: string; to?: string }) =>
    apiClient.get('/admin/analytics/financial', { params }).then((r) => r.data),

  getBookingProfit: (id: number) =>
    apiClient.get(`/admin/bookings/${id}/profit`).then((r) => r.data),

  // Expenses
  getExpenses: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/admin/expenses', { params }).then((r) => r.data),

  createExpense: (data: { description: string; amount: number; category?: string; date: string }) =>
    apiClient.post('/admin/expenses', data).then((r) => r.data),

  updateExpense: (id: number, data: { description?: string; amount?: number; category?: string; date?: string }) =>
    apiClient.patch(`/admin/expenses/${id}`, data).then((r) => r.data),

  deleteExpense: (id: number) =>
    apiClient.delete(`/admin/expenses/${id}`).then((r) => r.data),

  // FIX AD1: Payment Transactions
  getPaymentTransactions: (params?: { page?: number; limit?: number; method?: string; status?: string; from?: string; to?: string; search?: string }) =>
    apiClient.get('/admin/payments/transactions', { params }).then((r) => r.data),

  getDisputeDetail: (id: number) =>
    apiClient.get(`/admin/disputes/${id}`).then((r) => r.data),

  // FIX AD2: Dispute assignment & workflow
  assignDispute: (id: number, assignedToId: number | null) =>
    apiClient.patch(`/admin/disputes/${id}/assign`, { assignedToId }).then((r) => r.data),

  setDisputePriority: (id: number, priority: string) =>
    apiClient.patch(`/admin/disputes/${id}/priority`, { priority }).then((r) => r.data),

  setDisputeSla: (id: number, slaDeadline: string | null) =>
    apiClient.patch(`/admin/disputes/${id}/sla`, { slaDeadline }).then((r) => r.data),

  // FIX AD7: User merge / dedup
  findDuplicateUsers: (search: string) =>
    apiClient.get('/admin/users/duplicates', { params: { search } }).then((r) => r.data),

  mergeUsers: (keepId: number, mergeId: number) =>
    apiClient.post('/admin/users/merge', { keepId, mergeId }).then((r) => r.data),

  // FIX AD9: Notification templates
  getNotificationTemplates: () =>
    apiClient.get('/admin/notification-templates').then((r) => r.data),

  updateNotificationTemplate: (slug: string, data: { title?: string; body?: string; enabled?: boolean }) =>
    apiClient.patch(`/admin/notification-templates/${slug}`, data).then((r) => r.data),

  // FIX AD11: Host onboarding funnel
  getHostOnboardingFunnel: () =>
    apiClient.get('/admin/host-onboarding').then((r) => r.data),
};
