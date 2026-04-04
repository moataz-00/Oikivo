import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Resolves a relative /uploads/... path to the full backend URL */
export const BACKEND_BASE = API_URL.replace(/\/api$/, '');
export function getUploadUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND_BASE}${path}`;
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
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
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
export const adminApi = {
  getDashboard: (params?: { from?: string; to?: string }) =>
    apiClient.get('/admin/dashboard', { params }).then((r) => r.data),

  getRevenueChart: () =>
    apiClient.get('/admin/revenue-chart').then((r) => r.data),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiClient.get('/admin/users', { params }).then((r) => r.data),

  toggleUserActive: (id: number) =>
    apiClient.patch(`/admin/users/${id}/toggle-active`).then((r) => r.data),

  toggleUserAdmin: (id: number) =>
    apiClient.patch(`/admin/users/${id}/toggle-admin`).then((r) => r.data),

  // Properties
  getProperties: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get('/admin/properties', { params }).then((r) => r.data),

  updatePropertyStatus: (id: number, status: 'draft' | 'published' | 'archived') =>
    apiClient.patch(`/admin/properties/${id}/status`, { status }).then((r) => r.data),

  // Bookings
  getBookings: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get('/admin/bookings', { params }).then((r) => r.data),

  confirmPayment: (id: number) =>
    apiClient.post(`/admin/bookings/${id}/confirm-payment`).then((r) => r.data),

  declinePayment: (id: number, reason?: string) =>
    apiClient.post(`/admin/bookings/${id}/decline-payment`, { reason }).then((r) => r.data),

  // Reviews
  getReviews: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/admin/reviews', { params }).then((r) => r.data),

  deleteReview: (id: number) =>
    apiClient.delete(`/admin/reviews/${id}`).then((r) => r.data),

  // ID Verification
  reviewIdDocument: (id: number, approved: boolean) =>
    apiClient.patch(`/admin/users/${id}/review-id`, { approved }).then((r) => r.data),

  // Bulk actions
  bulkUserAction: (ids: number[], action: 'activate' | 'deactivate' | 'grant_admin' | 'revoke_admin') =>
    apiClient.post('/admin/users/bulk', { ids, action }).then((r) => r.data),

  bulkPropertyStatus: (ids: number[], status: 'draft' | 'published' | 'archived') =>
    apiClient.post('/admin/properties/bulk', { ids, status }).then((r) => r.data),

  // Activity Log
  getActivityLog: (params?: { page?: number; limit?: number; adminId?: number }) =>
    apiClient.get('/admin/activity-log', { params }).then((r) => r.data),

  // Payouts
  getPayouts: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/admin/payouts', { params }).then((r) => r.data),

  processPayout: (id: number, status: 'processing' | 'completed' | 'failed', note?: string) =>
    apiClient.patch(`/admin/payouts/${id}/process`, { status, note }).then((r) => r.data),

  // Disputes
  getDisputes: (status?: string) =>
    apiClient.get('/admin/disputes', { params: status ? { status } : undefined }).then((r) => r.data),

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

  // Consultations
  getConsultationStats: () =>
    apiClient.get('/admin/consultations/stats').then((r) => r.data),

  getConsultants: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/admin/consultations/consultants', { params }).then((r) => r.data),

  reviewConsultant: (id: number, decision: string, rejectionReason?: string) =>
    apiClient.patch(`/admin/consultations/consultants/${id}/review`, { decision, rejectionReason }).then((r) => r.data),
};
