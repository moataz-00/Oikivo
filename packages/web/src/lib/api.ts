import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  Property,
  SearchPropertiesParams,
  PaginatedProperties,
  CreateListingPayload,
  PricePreview,
  Booking,
  CreateBookingPayload,
  Review,
  CreateReviewPayload,
  ReviewStats,
  Wishlist,
  Conversation,
  Message,
  Notification,
  CalendarDay,
  BlockDatesPayload,
  PopularCity,
  Category,
  Amenity,
  AdminDashboardStats,
  AdminUser,
  AdminProperty,
  AdminBooking,
  AdminPaginatedResponse,
  RevenueChartPoint,
  Earning,
  Payout,
  EarningsResponse,
  RequestPayoutPayload,
  CoHost,
  InviteCohostPayload,
  HostAnalytics,
  Experience,
  ExperienceCategory,
  SearchExperiencesParams,
  PaginatedExperiences,
  ExperiencePricePreview,
  CreateExperiencePayload,
  ExperienceBooking,
  CreateExperienceBookingPayload,
  ExperienceReview,
  CreateExperienceReviewPayload,
  ExperienceReviewStats,
  ICalSource,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function getLocalizedLoginPath(): string {
  if (typeof window === 'undefined') return '/en/login';
  const firstSegment = window.location.pathname.split('/').filter(Boolean)[0];
  const locale = firstSegment === 'ar' || firstSegment === 'en' ? firstSegment : 'en';
  return `/${locale}/login`;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true, // send httpOnly cookies (refresh_token) automatically
});

// ─── Request interceptor: attach Bearer token ────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 ────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Never hard-redirect while the OAuth callback page is storing tokens
        if (window.location.pathname.includes('/auth/callback')) {
          return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post<AuthResponse>(`${BASE_URL}/auth/refresh`, {
              refreshToken,
            });
            localStorage.setItem('access_token', data.accessToken);
            if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${data.accessToken}`;
              return apiClient(error.config);
            }
          } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = getLocalizedLoginPath();
          }
        } else {
          // No refresh token in localStorage — try cookie-based refresh
          // (backend reads refresh_token from httpOnly cookie automatically)
          try {
            const { data } = await axios.post<AuthResponse>(
              `${BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true },
            );
            localStorage.setItem('access_token', data.accessToken);
            if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${data.accessToken}`;
              return apiClient(error.config);
            }
          } catch {
            localStorage.removeItem('access_token');
            window.location.href = getLocalizedLoginPath();
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Response normalizers: map backend field names to frontend types ──────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProperty(raw: any): Property {
  const houseRules = Array.isArray(raw.houseRules)
    ? raw.houseRules.map((r: { rule: string }) => r.rule).filter(Boolean).join('\n')
    : (typeof raw.houseRules === 'string' ? raw.houseRules : undefined);

  return {
    ...raw,
    uuid: raw.uuid ?? '',
    images: raw.photos ?? raw.images ?? [],
    price: Number(raw.pricePerNight ?? raw.price ?? 0),
    weekendPrice: raw.weekendPrice != null ? Number(raw.weekendPrice) : null,
    weeklyDiscount: Number(raw.weeklyDiscount ?? raw.weeklyDiscountPercent ?? 0),
    monthlyDiscount: Number(raw.monthlyDiscount ?? raw.monthlyDiscountPercent ?? 0),
    minNights: Number(raw.minNights ?? 1),
    maxNights: Number(raw.maxNights ?? 365),
    lat: Number(raw.latitude ?? raw.lat ?? 0),
    lng: Number(raw.longitude ?? raw.lng ?? 0),
    kind: raw.propertyKind ?? raw.kind,
    allowPets: raw.allowsPets ?? raw.allowPets ?? false,
    checkInTime: raw.checkInAfter ?? raw.checkInTime,
    checkOutTime: raw.checkOutBefore ?? raw.checkOutTime,
    houseRules,
  } as Property;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBooking(raw: any): Booking {
  return {
    ...raw,
    property: raw.property ? normalizeProperty(raw.property) : raw.property,
    guests: Number(raw.guests ?? raw.guestsCount ?? 0),
    basePrice: Number(raw.basePrice ?? raw.baseAmount ?? 0),
    total: Number(raw.total ?? raw.totalAmount ?? 0),
    message: raw.message ?? raw.guestNote ?? raw.specialRequests ?? null,
  } as Booking;
}

function mapListingPayloadToBackend(payload: Partial<CreateListingPayload>) {
  return {
    title: payload.title,
    description: payload.description,
    type: payload.type,
    spaceType: payload.spaceType,
    propertyKind: payload.kind,
    pricePerNight: payload.price,
    weekendPrice: payload.weekendPrice,
    weeklyDiscount: payload.weeklyDiscount,
    monthlyDiscount: payload.monthlyDiscount,
    cleaningFee: payload.cleaningFee,
    securityDeposit: payload.securityDeposit,
    minNights: payload.minNights,
    maxNights: payload.maxNights,
    maxGuests: payload.maxGuests,
    bedrooms: payload.bedrooms,
    beds: payload.beds,
    bathrooms: payload.bathrooms,
    address: payload.address,
    city: payload.city,
    country: payload.country,
    latitude: payload.lat,
    longitude: payload.lng,
    amenityIds: payload.amenityIds,
    checkInAfter: payload.checkInTime,
    checkOutBefore: payload.checkOutTime,
    instantBook: payload.instantBook,
    allowsPets: payload.allowPets,
    allowsSmoking: payload.allowsSmoking,
    allowsParties: payload.allowsParties,
    allowsChildren: payload.allowsChildren,
    categoryId: payload.categoryId,
    cancellationPolicy: payload.cancellationPolicy,
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  logout: () =>
    apiClient.post('/auth/logout').then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () =>
    apiClient.get<User>('/auth/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, password }).then((r) => r.data),

  sendVerificationEmail: () =>
    apiClient.post<{ message: string; devToken?: string }>('/auth/send-verification-email').then((r) => r.data),

  verifyEmail: (token: string) =>
    apiClient.get<{ message: string }>('/auth/verify-email', { params: { token } }).then((r) => r.data),

  sendPhoneVerification: () =>
    apiClient.post<{ message: string; devCode?: string }>('/auth/send-phone-verification').then((r) => r.data),

  verifyPhone: (code: string) =>
    apiClient.post<{ message: string }>('/auth/verify-phone', { code }).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),

  setPassword: (newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/set-password', { newPassword }).then((r) => r.data),

  requestEmailChange: (newEmail: string) =>
    apiClient.post<{ message: string; devToken?: string }>('/auth/request-email-change', { newEmail }).then((r) => r.data),

  confirmEmailChange: (token: string) =>
    apiClient.get<{ message: string }>('/auth/confirm-email-change', { params: { token } }).then((r) => r.data),

  validateResetToken: (token: string) =>
    apiClient.get<{ valid: boolean }>('/auth/validate-reset-token', { params: { token } }).then((r) => r.data),

  unlinkGoogle: () =>
    apiClient.delete<{ message: string }>('/auth/google/unlink').then((r) => r.data),

  // 2FA TOTP
  setupTotp: () =>
    apiClient.post<{ secret: string; qrDataUrl: string }>('/auth/totp/setup').then((r) => r.data),

  enableTotp: (code: string) =>
    apiClient.post<{ message: string }>('/auth/totp/enable', { code }).then((r) => r.data),

  disableTotp: (code: string) =>
    apiClient.post<{ message: string }>('/auth/totp/disable', { code }).then((r) => r.data),

  // Sessions
  getSessions: () =>
    apiClient.get<any[]>('/auth/sessions').then((r) => r.data),

  revokeSession: (id: number) =>
    apiClient.delete<{ message: string }>(`/auth/sessions/${id}`).then((r) => r.data),

  revokeAllSessions: () =>
    apiClient.delete<{ message: string }>('/auth/sessions').then((r) => r.data),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () =>
    apiClient.get<User>('/users/me').then((r) => r.data),

  updateProfile: (payload: Partial<Pick<User, 'firstName' | 'lastName' | 'bio' | 'phone' | 'preferredLanguage'>>) =>
    apiClient.patch<User>('/users/me', payload).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<User>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  becomeHost: () =>
    apiClient.post<User>('/users/me/become-host').then((r) => r.data),

  requestHostActivation: (locale: 'en' | 'ar' = 'en') =>
    apiClient
      .post<{ message: string }>('/users/me/request-host-activation', { locale })
      .then((r) => r.data),

  confirmHostActivation: (token: string) =>
    apiClient
      .get<{ message: string; user: User }>('/users/host-activation/confirm', {
        params: { token },
      })
      .then((r) => r.data),

  submitIdDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<{ message: string }>('/users/me/verify-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  deleteAccount: () =>
    apiClient.delete<{ message: string }>('/users/me').then((r) => r.data),

  exportData: () =>
    apiClient.get<object>('/users/me/export').then((r) => r.data),

  getPublicProfile: (id: number) =>
    apiClient.get<User>(`/users/${id}`).then((r) => r.data),

  getProfileByUuid: (uuid: string) =>
    apiClient.get<User>(`/users/profile/${encodeURIComponent(uuid)}`).then((r) => r.data),

  getAvailableCohosts: (search?: string, limit = 20, offset = 0) =>
    apiClient
      .get<{ items: User[]; total: number }>('/users/available-cohosts', {
        params: { ...(search ? { search } : {}), limit, offset },
      })
      .then((r) => r.data),

  getUserPublicProfile: (id: number) =>
    apiClient.get<User>(`/users/${id}`).then((r) => r.data),

  getUserReviews: (id: number) =>
    apiClient.get<Review[]>(`/users/${id}/reviews`).then((r) => r.data),

  getUserStats: (id: number) =>
    apiClient.get<{ totalStays: number; avgRatingAsHost: number; totalReviewsAsHost: number; isSuperhost: boolean; memberSince: string }>(`/users/${id}/stats`).then((r) => r.data),

  getHostPublicListings: (id: number) =>
    apiClient.get<any[]>(`/users/${id}/listings`).then((r) => r.data),

  /** G7: Notification preferences */
  getNotificationPreferences: () =>
    apiClient.get<Record<string, boolean>>('/users/me/notification-preferences').then((r) => r.data),

  updateNotificationPreferences: (prefs: Record<string, boolean>) =>
    apiClient.patch<Record<string, boolean>>('/users/me/notification-preferences', prefs).then((r) => r.data),
};

// ─── Properties ──────────────────────────────────────────────────────────────
export const propertiesApi = {
  getProperty: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>(`/properties/${id}`).then((r) => normalizeProperty(r.data)),

  getPropertyByUuid: (uuid: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>(`/properties/${uuid}`).then((r) => normalizeProperty(r.data)),

  searchProperties: (params: SearchPropertiesParams) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>('/search', { params }).then((r) => ({
      ...r.data,
      data: (r.data.data ?? []).map(normalizeProperty),
    }) as PaginatedProperties),

  getHostListings: (): Promise<Property[]> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>('/properties/host/listings').then((r) =>
      (r.data.items ?? r.data).map(normalizeProperty).filter((p: Property) => p.status !== 'archived')
    ),

  getArchivedListings: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any[]>('/properties/host/archived').then((r) => r.data.map(normalizeProperty)),

  restoreListing: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.post<any>(`/properties/${id}/restore`).then((r) => normalizeProperty(r.data)),

  permanentDeleteListing: (id: number) =>
    apiClient.delete(`/properties/${id}/permanent`).then((r) => r.data),

  createListing: (payload: CreateListingPayload) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient
      .post<any>('/properties', mapListingPayloadToBackend(payload))
      .then((r) => normalizeProperty(r.data)),

  updateListing: (id: number, payload: Partial<CreateListingPayload>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient
      .patch<any>(`/properties/${id}`, mapListingPayloadToBackend(payload))
      .then((r) => normalizeProperty(r.data)),

  publishListing: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.post<any>(`/properties/${id}/publish`).then((r) => normalizeProperty(r.data)),

  verifyListing: (id: number) =>
    apiClient.get(`/properties/${id}/verify`).then((r) => r.data),

  bulkAction: (ids: number[], action: 'publish' | 'archive' | 'delete') =>
    apiClient.post<{ succeeded: number[]; failed: number[] }>('/properties/bulk-action', { ids, action }).then((r) => r.data),

  unpublishListing: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.post<any>(`/properties/${id}/unpublish`).then((r) => normalizeProperty(r.data)),

  deleteListing: (id: number) =>
    apiClient.delete(`/properties/${id}`).then((r) => r.data),

  uploadImages: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiClient.post(`/uploads/photos/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  reorderPhotos: (photoOrders: Array<{ id: number; displayOrder: number }>) =>
    apiClient.patch('/uploads/photos/reorder', { photoOrders }).then((r) => r.data),

  deletePhoto: (photoId: number) =>
    apiClient.delete(`/uploads/photos/${photoId}`).then((r) => r.data),

  setCoverPhoto: (photoId: number) =>
    apiClient.patch(`/uploads/photos/${photoId}/cover`).then((r) => r.data),

  updateHouseRules: (id: number, rulesStr: string) => {
    const rules = rulesStr.split('\n').filter(Boolean).map((rule) => ({ rule }));
    return apiClient.patch(`/properties/${id}/house-rules`, { rules }).then((r) => r.data);
  },

  getPricePreview: (id: number, checkIn: string, checkOut: string, guests: number) =>
    apiClient
      .get<PricePreview>(`/properties/${id}/price-preview`, {
        params: { checkIn, checkOut, guests },
      })
      .then((r) => r.data),

  transferProperty: (id: number, newOwnerEmail: string) =>
    apiClient.post<{ message: string }>(`/properties/${id}/transfer`, { newOwnerEmail }).then((r) => r.data),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  createBooking: (payload: CreateBookingPayload) =>
    apiClient
      .post<Booking>('/bookings', {
        propertyId: payload.propertyId,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        guestsCount: payload.guests,
        guestNote: payload.message,
        displayCurrency: payload.displayCurrency,
      })
      .then((r) => normalizeBooking(r.data)),

  getMyTrips: (status?: string) =>
    apiClient
      .get<Booking[]>('/bookings/my-trips', { params: { status } })
      .then((r) => (r.data ?? []).map(normalizeBooking)),

  getMyPaymentHistory: () =>
    apiClient
      .get<Booking[]>('/bookings/my-payments')
      .then((r) => (r.data ?? []).map(normalizeBooking)),

  getHostReservations: (status?: string) =>
    apiClient
      .get<Booking[]>('/bookings/host/reservations', { params: { status } })
      .then((r) => (r.data ?? []).map(normalizeBooking)),

  getHostCalendar: (month: string) =>
    apiClient
      .get<Booking[]>('/bookings/host/calendar', { params: { month } })
      .then((r) => (r.data ?? []).map(normalizeBooking)),

  getHostAnalytics: () =>
    apiClient.get<HostAnalytics>('/bookings/host/analytics').then((r) => r.data),

  getBooking: (id: number) =>
    apiClient.get<Booking>(`/bookings/${id}`).then((r) => normalizeBooking(r.data)),

  getBookingByRef: (ref: string) =>
    /^\d+$/.test(ref)
      ? apiClient.get<Booking>(`/bookings/${ref}`).then((r) => normalizeBooking(r.data))
      : apiClient.get<Booking>(`/bookings/ref/${encodeURIComponent(ref)}`).then((r) => normalizeBooking(r.data)),

  confirmBooking: (id: number) =>
    apiClient.patch<Booking>(`/bookings/${id}/confirm`).then((r) => normalizeBooking(r.data)),

  declineBooking: (id: number) =>
    apiClient.patch<Booking>(`/bookings/${id}/decline`, {}).then((r) => normalizeBooking(r.data)),

  cancelBooking: (id: number, reason?: string) =>
    apiClient.patch<Booking>(`/bookings/${id}/cancel`, { reason }).then((r) => normalizeBooking(r.data)),

  getCancellationPreview: (id: number) =>
    apiClient.get(`/bookings/${id}/cancellation-preview`).then((r) => r.data),

  submitPayment: (id: number, data: { method: string; reference: string; note?: string; proofUrl?: string }) =>
    apiClient.patch<Booking>(`/bookings/${id}/submit-payment`, data).then((r) => normalizeBooking(r.data)),

  claimDeposit: (id: number, reason: string) =>
    apiClient.post<Booking>(`/bookings/${id}/deposit/claim`, { reason }).then((r) => normalizeBooking(r.data)),

  releaseDeposit: (id: number) =>
    apiClient.patch<Booking>(`/bookings/${id}/deposit/release`).then((r) => normalizeBooking(r.data)),

  getHostPendingPayments: () =>
    apiClient.get<Booking[]>('/bookings/host/pending-payments').then((r) => (r.data ?? []).map(normalizeBooking)),



  downloadInvoice: (id: number) =>
    apiClient.get(`/bookings/${id}/invoice`, { responseType: 'blob' }).then((r) => r.data),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getPropertyReviews: (propertyId: number, page = 1, limit = 10) =>
    apiClient
      .get<{ items: Review[]; total: number; page: number; limit: number; totalPages: number }>(`/reviews/property/${propertyId}`, {
        params: { page, limit },
      })
      .then((r) => r.data),

  createReview: (payload: CreateReviewPayload) =>
    apiClient.post<Review>('/reviews', payload).then((r) => r.data),

  replyReview: (id: number, reply: string) =>
    apiClient.patch<Review>(`/reviews/${id}/reply`, { reply }).then((r) => r.data),

  updateReview: (id: number, payload: Partial<CreateReviewPayload>) =>
    apiClient.patch<Review>(`/reviews/${id}`, payload).then((r) => r.data),

  deleteReview: (id: number) =>
    apiClient.delete(`/reviews/${id}`).then((r) => r.data),

  getReviewStats: (propertyId: number) =>
    apiClient.get<ReviewStats>(`/reviews/property/${propertyId}/stats`).then((r) => r.data),
};

// ─── Wishlists ────────────────────────────────────────────────────────────────
function normalizeWishlist(raw: any): Wishlist {
  const items: any[] = raw.items ?? [];
  return {
    ...raw,
    properties: items.map((item: any) => normalizeProperty(item.property ?? item)),
    count: items.length,
    coverImage: raw.coverPhoto ?? raw.coverImage ?? null,
  } as Wishlist;
}

export const wishlistsApi = {
  getWishlists: () =>
    apiClient.get<any[]>('/wishlists').then((r) => r.data.map(normalizeWishlist)),

  getWishlist: (id: number) =>
    apiClient.get<any>(`/wishlists/${id}`).then((r) => normalizeWishlist(r.data)),

  createWishlist: (name: string) =>
    apiClient.post<Wishlist>('/wishlists', { name }).then((r) => r.data),

  deleteWishlist: (id: number) =>
    apiClient.delete(`/wishlists/${id}`).then((r) => r.data),

  addToWishlist: (wishlistId: number, propertyId: number) =>
    apiClient.post(`/wishlists/${wishlistId}/items`, { propertyId }).then((r) => r.data),

  removeFromWishlist: (wishlistId: number, propertyId: number) =>
    apiClient.delete(`/wishlists/${wishlistId}/items/${propertyId}`).then((r) => r.data),

  checkWishlisted: (propertyId: number) =>
    apiClient
      .get<{ isWishlisted: boolean; wishlistId?: number }>(`/wishlists/check/${propertyId}`)
      .then((r) => r.data),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMessage(raw: any): Message {
  return {
    id: raw.id,
    content: raw.content ?? raw.body ?? '',
    messageType: raw.messageType ?? raw.message_type ?? 'text',
    imageUrl: raw.imageUrl ?? raw.image_url ?? null,
    sender: raw.sender ?? {},
    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : new Date(raw.createdAt ?? Date.now()).toISOString(),
    isRead: raw.isRead ?? raw.is_read ?? false,
  } as Message;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeConversation(raw: any): Conversation {
  const participants: User[] = [];
  if (raw.guest) participants.push(raw.guest as User);
  if (raw.host) participants.push(raw.host as User);
  // Fallback: participants array already present (future-proof)
  if (participants.length === 0 && Array.isArray(raw.participants)) {
    participants.push(...(raw.participants as User[]));
  }
  const fallbackUpdatedAt =
    raw.lastMessage?.createdAt ?? raw.createdAt ?? new Date().toISOString();
  return {
    id: raw.id,
    guestId: raw.guestId,
    hostId: raw.hostId,
    participants,
    property: raw.property ? normalizeProperty(raw.property) : undefined,
    lastMessage: raw.lastMessage ? normalizeMessage(raw.lastMessage) : undefined,
    unreadCount: raw.unreadCount ?? 0,
    updatedAt:
      typeof raw.updatedAt === 'string' ? raw.updatedAt : fallbackUpdatedAt,
    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : new Date(raw.createdAt ?? Date.now()).toISOString(),
  } as Conversation;
}

export const messagesApi = {
  getConversations: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any[]>('/messages/conversations').then((r) =>
      (r.data ?? []).map(normalizeConversation)
    ),

  getMessages: (conversationId: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>(`/messages/conversations/${conversationId}`).then((r) => {
      const items = r.data?.items ?? r.data ?? [];
      return (items as unknown[]).map(normalizeMessage);
    }),

  sendMessage: (conversationId: number, body: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient
      .post<any>(`/messages/conversations/${conversationId}/messages`, { body })
      .then((r) => normalizeMessage(r.data)),

  uploadMessageImage: (conversationId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .post<any>(`/messages/conversations/${conversationId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => normalizeMessage(r.data));
  },

  startConversation: (hostId: number, body: string, propertyId?: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient
      .post<any>('/messages/conversations', { hostId, body, propertyId })
      .then((r) => normalizeConversation(r.data)),

  markRead: (conversationId: number) =>
    apiClient.patch(`/messages/conversations/${conversationId}/read`).then((r) => r.data),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/messages/unread-count').then((r) => r.data),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  getCategories: () =>
    apiClient.get<Category[]>('/categories').then((r) => r.data),
};

// ─── Amenities ────────────────────────────────────────────────────────────────
export const amenitiesApi = {
  getAmenities: () =>
    // Backend may return either Amenity[] or grouped object { [category]: Amenity[] }.
    apiClient.get<Amenity[] | Record<string, Amenity[]>>('/amenities').then((r) => {
      const data = r.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        return Object.values(data).flat();
      }
      return [];
    }),
};

// ─── Availability ─────────────────────────────────────────────────────────────
export const availabilityApi = {
  getCalendar: (propertyId: number, year: number, month: number) =>
    apiClient
      .get<{ days: Array<{ date: string; isBlocked: boolean; isBooked: boolean; price: number; priceOverride: number | null }> }>(`/availability/${propertyId}`, {
        params: { year, month },
      })
      .then((r) =>
        (r.data.days ?? []).map((d): CalendarDay => ({
          date: d.date,
          status: d.isBooked ? 'booked' : d.isBlocked ? 'blocked' : 'available',
          price: d.price,
        }))
      ),

  blockDates: (payload: BlockDatesPayload) =>
    apiClient.post(`/availability/${payload.propertyId}/block`, {
      dates: payload.dates,
      isBlocked: true,
      ...(payload.priceOverride !== undefined ? { priceOverride: payload.priceOverride } : {}),
    }).then((r) => r.data),

  unblockDates: (propertyId: number, dates: string[]) =>
    apiClient.post(`/availability/${propertyId}/block`, { dates, isBlocked: false }).then((r) => r.data),

  setSeasonalPricing: (
    propertyId: number,
    data: { startDate: string; endDate: string; pricePerNight: number; label?: string },
  ) =>
    apiClient.post(`/availability/${propertyId}/seasonal-pricing`, data).then((r) => r.data),

  // ─── iCal / Channel Manager ─────────────────────────────────────────────
  getChannels: (propertyId: number) =>
    apiClient.get(`/availability/${propertyId}/channels`).then((r) => r.data as ICalSource[]),

  addChannel: (propertyId: number, label: string, url: string) =>
    apiClient.post(`/availability/${propertyId}/channels`, { label, url }).then((r) => r.data as ICalSource),

  removeChannel: (propertyId: number, sourceId: number) =>
    apiClient.delete(`/availability/${propertyId}/channels/${sourceId}`),

  syncChannel: (propertyId: number, sourceId: number) =>
    apiClient.post(`/availability/${propertyId}/channels/${sourceId}/sync`).then((r) => r.data as ICalSource),

  getIcalExportUrl: (propertyId: number) =>
    `${apiClient.defaults.baseURL}/availability/${propertyId}/calendar.ics`,
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getNotifications: (page = 1) =>
    apiClient
      .get<{ items: Notification[]; total: number; totalPages: number }>('/notifications', { params: { page } })
      .then((r) => r.data),

  markRead: (id: number) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.patch('/notifications/mark-all-read').then((r) => r.data),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  registerPushToken: (token: string) =>
    apiClient.post('/notifications/push-token', { token }).then((r) => r.data),

  removePushToken: () =>
    apiClient.delete('/notifications/push-token').then((r) => r.data),
};

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchApi = {
  search: (params: SearchPropertiesParams) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>('/search', { params }).then((r) => ({
      ...r.data,
      data: (r.data.data ?? []).map(normalizeProperty),
    }) as PaginatedProperties),

  nearbyProperties: (lat: number, lng: number, radius = 10) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any[]>('/search/nearby', { params: { lat, lng, radius } })
      .then((r) => r.data.map(normalizeProperty)),

  popularCities: () =>
    apiClient.get<PopularCity[]>('/search/popular-cities').then((r) => r.data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  getDashboard: () =>
    apiClient.get<AdminDashboardStats>('/admin/dashboard').then((r) => r.data),

  getRevenueChart: () =>
    apiClient.get<RevenueChartPoint[]>('/admin/revenue-chart').then((r) => r.data),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiClient.get<AdminPaginatedResponse<AdminUser>>('/admin/users', { params }).then((r) => r.data),

  toggleUserActive: (id: number) =>
    apiClient.patch<{ message: string; isActive: boolean }>(`/admin/users/${id}/toggle-active`).then((r) => r.data),

  toggleUserAdmin: (id: number) =>
    apiClient.patch<{ message: string; isAdmin: boolean }>(`/admin/users/${id}/toggle-admin`).then((r) => r.data),

  reviewIdDocument: (id: number, approved: boolean) =>
    apiClient.patch<{ message: string; isIdVerified: boolean }>(`/admin/users/${id}/review-id`, { approved }).then((r) => r.data),

  // Properties
  getProperties: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get<AdminPaginatedResponse<AdminProperty>>('/admin/properties', { params }).then((r) => r.data),

  updatePropertyStatus: (id: number, status: 'draft' | 'published' | 'archived') =>
    apiClient.patch(`/admin/properties/${id}/status`, { status }).then((r) => r.data),

  // Bookings
  getBookings: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get<AdminPaginatedResponse<AdminBooking>>('/admin/bookings', { params }).then((r) => r.data),

  confirmPayment: (id: number) =>
    apiClient.post(`/admin/bookings/${id}/confirm-payment`).then((r) => r.data),

  // Reviews
  getReviews: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/admin/reviews', { params }).then((r) => r.data),

  deleteReview: (id: number) =>
    apiClient.delete(`/admin/reviews/${id}`).then((r) => r.data),

  // C8: Consultation review moderation
  getConsultationReviews: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/admin/consultations/reviews', { params }).then((r) => r.data),

  toggleConsultationReviewHidden: (id: number) =>
    apiClient.patch(`/admin/consultations/reviews/${id}/hide`).then((r) => r.data),

  // C12: Consultant payout management (admin)
  getConsultantPayouts: (params?: { page?: number; status?: string }) =>
    apiClient.get('/admin/consultations/payouts', { params }).then((r) => r.data),

  processConsultantPayout: (id: number, data: { status: 'processing' | 'completed' | 'failed'; note?: string }) =>
    apiClient.patch(`/admin/consultations/payouts/${id}`, data).then((r) => r.data),

  // Payouts
  getPayouts: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/admin/payouts', { params }).then((r) => r.data),

  processPayout: (id: number, status: 'processing' | 'completed' | 'failed', note?: string) =>
    apiClient.patch(`/admin/payouts/${id}/process`, { status, note }).then((r) => r.data),

  // Disputes (admin)
  getDisputes: (status?: string) =>
    apiClient.get('/admin/disputes', { params: status ? { status } : undefined }).then((r) => r.data),

  resolveDispute: (id: number, resolution: string, adminNote: string) =>
    apiClient.patch(`/admin/disputes/${id}/resolve`, { resolution, adminNote }).then((r) => r.data),

  updateDisputeStatus: (id: number, status: string) =>
    apiClient.patch(`/admin/disputes/${id}/status`, { status }).then((r) => r.data),
};

// ─── Payouts & Earnings ───────────────────────────────────────────────────────
export const payoutsApi = {
  getEarnings: () =>
    apiClient.get<EarningsResponse>('/payouts/earnings').then((r) => r.data),

  requestPayout: (payload: RequestPayoutPayload) =>
    apiClient.post<Payout>('/payouts/request', payload).then((r) => r.data),

  getPayoutHistory: () =>
    apiClient.get<Payout[]>('/payouts/history').then((r) => r.data),
};

// ─── Disputes ─────────────────────────────────────────────────────────────────
export const disputesApi = {
  create: (payload: { bookingId: number; category: string; title: string; description: string }) =>
    apiClient.post('/disputes', payload).then((r) => r.data),

  uploadEvidence: (disputeId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiClient.post(`/disputes/${disputeId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  getMyDisputes: () =>
    apiClient.get('/disputes').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get(`/disputes/${id}`).then((r) => r.data),

  appendUpdate: (id: number, message: string) =>
    apiClient.patch(`/disputes/${id}/update`, { message }).then((r) => r.data),
};

// ─── Co-hosts ─────────────────────────────────────────────────────────────────
export const cohostsApi = {
  // B8: supports pagination
  getCohosts: (propertyId: number, page = 1, limit = 50) =>
    apiClient
      .get<{ items: CoHost[]; total: number; page: number; limit: number }>(
        `/properties/${propertyId}/cohosts`,
        { params: { page, limit } },
      )
      .then((r) => r.data),

  invite: (propertyId: number, payload: InviteCohostPayload) =>
    apiClient.post<CoHost>(`/properties/${propertyId}/cohosts`, payload).then((r) => r.data),

  respond: (propertyId: number, cohostId: number, response: 'accepted' | 'declined') =>
    apiClient
      .patch<CoHost>(`/properties/${propertyId}/cohosts/${cohostId}/respond`, { response })
      .then((r) => r.data),

  remove: (propertyId: number, cohostId: number) =>
    apiClient.delete(`/properties/${propertyId}/cohosts/${cohostId}`).then((r) => r.data),

  // B4: re-invite a declined co-host
  reinvite: (propertyId: number, cohostId: number) =>
    apiClient
      .patch<CoHost>(`/properties/${propertyId}/cohosts/${cohostId}/reinvite`)
      .then((r) => r.data),

  getMyInvites: () =>
    apiClient.get<CoHost[]>('/cohosts/my-invites').then((r) => r.data),

  // B5: properties where current user is an accepted co-host
  getMyProperties: () =>
    apiClient.get<CoHost[]>('/cohosts/my-properties').then((r) => r.data),

  // All co-hosts / cleaners across all properties the current user owns as a host
  getMyTeam: () =>
    apiClient.get<CoHost[]>('/cohosts/my-team').then((r) => r.data),
};

// ─── Experience normalizer ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeExperience(raw: any): Experience {
  return {
    ...raw,
    uuid: raw.uuid ?? '',
    pricePerPerson: Number(raw.pricePerPerson ?? raw.price_per_person ?? 0),
    groupDiscountPercent: Number(raw.groupDiscountPercent ?? raw.group_discount_percent ?? 0),
    durationMinutes: Number(raw.durationMinutes ?? raw.duration_minutes ?? 120),
    maxGuests: Number(raw.maxGuests ?? raw.max_guests ?? 10),
    minGuests: Number(raw.minGuests ?? raw.min_guests ?? 1),
    lat: Number(raw.latitude ?? raw.lat ?? 0),
    lng: Number(raw.longitude ?? raw.lng ?? 0),
    avgRating: raw.avgRating != null ? Number(raw.avgRating) : null,
    reviewCount: Number(raw.reviewCount ?? raw.review_count ?? 0),
    totalBookings: Number(raw.totalBookings ?? raw.total_bookings ?? 0),
    photos: raw.photos ?? [],
    itinerary: raw.itinerary ?? [],
    schedule: raw.schedule ?? [],
    instantBook: !!raw.instantBook,
  } as Experience;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeExperienceBooking(raw: any): ExperienceBooking {
  return {
    ...raw,
    experience: raw.experience ? normalizeExperience(raw.experience) : raw.experience,
    pricePerPerson: Number(raw.pricePerPerson ?? 0),
    subtotal: Number(raw.subtotal ?? 0),
    discountAmount: Number(raw.discountAmount ?? 0),
    serviceFee: Number(raw.serviceFee ?? 0),
    totalAmount: Number(raw.totalAmount ?? 0),
    guestsCount: Number(raw.guestsCount ?? 0),
  } as ExperienceBooking;
}

// ─── Experiences ──────────────────────────────────────────────────────────────
export const experiencesApi = {
  getCategories: () =>
    apiClient.get<ExperienceCategory[]>('/experiences/categories').then((r) => r.data),

  search: (params: SearchExperiencesParams) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>('/experiences/search', { params }).then((r) => ({
      ...r.data,
      items: (r.data.items ?? []).map(normalizeExperience),
    }) as PaginatedExperiences),

  getById: (id: string | number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>(`/experiences/${id}`).then((r) => normalizeExperience(r.data)),

  create: (payload: CreateExperiencePayload) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.post<any>('/experiences', payload).then((r) => normalizeExperience(r.data)),

  update: (id: number, payload: Partial<CreateExperiencePayload>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.patch<any>(`/experiences/${id}`, payload).then((r) => normalizeExperience(r.data)),

  delete: (id: number) =>
    apiClient.delete(`/experiences/${id}`).then((r) => r.data),

  publish: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.post<any>(`/experiences/${id}/publish`).then((r) => normalizeExperience(r.data)),

  archive: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.post<any>(`/experiences/${id}/archive`).then((r) => normalizeExperience(r.data)),

  restore: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.post<any>(`/experiences/${id}/restore`).then((r) => normalizeExperience(r.data)),

  getHostListings: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any[]>('/experiences/host/listings').then((r) => r.data.map(normalizeExperience)),

  getPricePreview: (id: number, guests: number) =>
    apiClient.get<ExperiencePricePreview>(`/experiences/${id}/price-preview`, { params: { guests } }).then((r) => r.data),

  uploadPhoto: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiClient.post(`/uploads/experience-photos/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  deleteExperiencePhoto: (photoId: number) =>
    apiClient.delete(`/uploads/experience-photos/${photoId}`).then((r) => r.data),
};

// ─── Experience Bookings ──────────────────────────────────────────────────────
export const experienceBookingsApi = {
  create: (payload: CreateExperienceBookingPayload) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.post<any>('/experience-bookings', payload).then((r) => normalizeExperienceBooking(r.data)),

  getMyTrips: (status?: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any[]>('/experience-bookings/my-trips', { params: status ? { status } : {} })
      .then((r) => r.data.map(normalizeExperienceBooking)),

  getHostReservations: (status?: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any[]>('/experience-bookings/host/reservations', { params: status ? { status } : {} })
      .then((r) => r.data.map(normalizeExperienceBooking)),

  getById: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.get<any>(`/experience-bookings/${id}`).then((r) => normalizeExperienceBooking(r.data)),

  confirm: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.patch<any>(`/experience-bookings/${id}/confirm`).then((r) => normalizeExperienceBooking(r.data)),

  decline: (id: number, reason?: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.patch<any>(`/experience-bookings/${id}/decline`, { reason }).then((r) => normalizeExperienceBooking(r.data)),

  cancel: (id: number, reason?: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.patch<any>(`/experience-bookings/${id}/cancel`, { reason }).then((r) => normalizeExperienceBooking(r.data)),

  complete: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.patch<any>(`/experience-bookings/${id}/complete`).then((r) => normalizeExperienceBooking(r.data)),

  submitPayment: (id: number, method: string, reference: string, proofUrl?: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiClient.patch<any>(`/experience-bookings/${id}/submit-payment`, { method, reference, proofUrl })
      .then((r) => normalizeExperienceBooking(r.data)),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getHostAnalytics: () => apiClient.get<any>('/experience-bookings/host/analytics').then((r) => r.data),
};

// ─── Experience Reviews ───────────────────────────────────────────────────────
export const experienceReviewsApi = {
  create: (payload: CreateExperienceReviewPayload) =>
    apiClient.post<ExperienceReview>('/experience-reviews', payload).then((r) => r.data),

  reply: (id: number, hostReply: string) =>
    apiClient.patch<ExperienceReview>(`/experience-reviews/${id}/reply`, { hostReply }).then((r) => r.data),

  getForExperience: (experienceId: number, page = 1, limit = 10) =>
    apiClient.get<{ items: ExperienceReview[]; total: number; page: number; limit: number; totalPages: number }>(
      `/experience-reviews/experience/${experienceId}`, { params: { page, limit } },
    ).then((r) => r.data),

  getStats: (experienceId: number) =>
    apiClient.get<ExperienceReviewStats>(`/experience-reviews/experience/${experienceId}/stats`).then((r) => r.data),
};

// ─── Stripe Payments ─────────────────────────────────────────────────────────
export const paymentsApi = {
  /** Create a Stripe PaymentIntent for a booking or experience booking */
  createIntent: (payload: { bookingId: number; bookingType: 'stay' | 'experience' }) =>
    apiClient
      .post<{ clientSecret: string }>('/payments/create-intent', payload)
      .then((r) => r.data),

  /** Request a Stripe refund for a paid booking */
  refund: (payload: { bookingId: number; bookingType: 'stay' | 'experience' }) =>
    apiClient.post<{ refundId: string }>('/payments/refund', payload).then((r) => r.data),

  // ─── OPay ────────────────────────────────────────────────────────────────

  /** Non-3DS OPay card payment — returns immediately with success/fail status */
  opayCard: (payload: {
    bookingId: number;
    bookingType: 'stay' | 'experience';
    cardHolderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    returnUrl?: string;
  }) =>
    apiClient
      .post<{ status: 'success' | 'failed'; orderNo?: string; message?: string }>(
        '/payments/opay/card',
        payload,
      )
      .then((r) => r.data),

  /** OPay e-wallet (MWALLET) payment — returns QR code image and reference */
  opayWallet: (payload: {
    bookingId: number;
    bookingType: 'stay' | 'experience';
    walletPhone: string;
  }) =>
    apiClient
      .post<{ qrCode: string; reference: string }>('/payments/opay/wallet', payload)
      .then((r) => r.data),

  /** Refund a booking that was paid via OPay */
  opayRefund: (payload: {
    bookingId: number;
    bookingType: 'stay' | 'experience';
    reason?: string;
  }) =>
    apiClient
      .post<{ orderStatus: string }>('/payments/opay/refund', payload)
      .then((r) => r.data),
};

// ─── Consultations Marketplace ───────────────────────────────────────────────
export const consultationsApi = {
  getConsultants: (params?: { page?: number; limit?: number; search?: string; specialization?: string }) =>
    apiClient.get('/consultations/consultants', { params }).then((r) => r.data),

  getConsultant: (id: number) =>
    apiClient.get(`/consultations/consultants/${id}`).then((r) => r.data),

  apply: (formData: FormData) =>
    apiClient.post('/consultations/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  uploadDocuments: (files: File[], documentTypes: string[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    fd.append('documentTypes', JSON.stringify(documentTypes));
    return apiClient.post('/consultations/documents', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  getMyProfile: () =>
    apiClient.get('/consultations/my-profile').then((r) => r.data),

  bookSession: (payload: {
    consultantId: number;
    durationMinutes: number;
    deliveryMode?: string;
    scheduledAt: string;
    clientNote?: string;
    paymentMethod?: string;
    serviceId?: number;
  }) =>
    apiClient.post('/consultations/book', payload).then((r) => r.data),

  confirmBooking: (id: number) =>
    apiClient.patch(`/consultations/bookings/${id}/confirm`).then((r) => r.data),

  completeBooking: (id: number) =>
    apiClient.patch(`/consultations/bookings/${id}/complete`).then((r) => r.data),

  cancelBooking: (id: number, reason?: string) =>
    apiClient.patch(`/consultations/bookings/${id}/cancel`, { reason }).then((r) => r.data),

  reviewSession: (payload: { bookingId: number; rating: number; comment?: string }) =>
    apiClient.post('/consultations/review', payload).then((r) => r.data),

  getMyBookings: (params?: { page?: number; limit?: number; role?: 'client' | 'consultant' }) =>
    apiClient.get('/consultations/my-bookings', { params }).then((r) => r.data),

  getConsultantBookings: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/consultations/consultant-bookings', { params }).then((r) => r.data),

  getConsultantSlots: (consultantId: number, date: string, durationMinutes: number) =>
    apiClient
      .get(`/consultations/consultants/${consultantId}/slots`, {
        params: { date, durationMinutes },
      })
      .then((r) => r.data as string[]),

  getMyStats: () =>
    apiClient.get('/consultations/my-stats').then((r) => r.data),

  respondBooking: (id: number, action: 'confirmed' | 'cancelled', opts?: { meetingLink?: string; cancellationReason?: string }) =>
    apiClient.patch(`/consultations/bookings/${id}/respond`, { action, ...opts }).then((r) => r.data),

  markInstapayPaid: (id: number) =>
    apiClient.patch(`/consultations/bookings/${id}/mark-instapay-paid`).then((r) => r.data),

  reviewBooking: (bookingId: number, payload: { rating: number; comment?: string }) =>
    apiClient.post(`/consultations/bookings/${bookingId}/review`, payload).then((r) => r.data),

  updateMyProfile: (payload: {
    displayName?: string;
    bio?: string;
    specializations?: string[];
    yearsExperience?: number;
    languages?: string[];
    hourlyRate?: number;
  }) => apiClient.patch('/consultations/my-profile', payload).then((r) => r.data),

  setAvailability: (slots: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
    apiClient.post('/consultations/availability', { slots }).then((r) => r.data),

  replyToReview: (reviewId: number, reply: string) =>
    apiClient.patch(`/consultations/reviews/${reviewId}/reply`, { reply }).then((r) => r.data),

  // Services CRUD
  createService: (payload: {
    title: string; titleAr?: string; description?: string; descriptionAr?: string;
    category: string; durationMinutes: number; price: number;
    currency?: string; deliveryMode?: string; maxBookingsPerDay?: number;
  }) => apiClient.post('/consultations/services', payload).then((r) => r.data),

  getMyServices: () =>
    apiClient.get('/consultations/services/mine').then((r) => r.data),

  updateService: (id: number, payload: {
    title?: string; titleAr?: string; description?: string; descriptionAr?: string;
    category?: string; durationMinutes?: number; price?: number;
    currency?: string; deliveryMode?: string; maxBookingsPerDay?: number; isActive?: boolean;
  }) => apiClient.patch(`/consultations/services/${id}`, payload).then((r) => r.data),

  deleteService: (id: number) =>
    apiClient.delete(`/consultations/services/${id}`).then((r) => r.data),

  getConsultantServices: (consultantId: number) =>
    apiClient.get(`/consultations/consultants/${consultantId}/services`).then((r) => r.data),

  submitInstapayProof: (id: number, data: { reference: string; proofUrl?: string }) =>
    apiClient.post(`/consultations/bookings/${id}/submit-instapay-proof`, data).then((r) => r.data),

  // C4: Vacation / out-of-office blocks
  blockVacation: (data: { startDate: string; endDate: string; reason?: string }) =>
    apiClient.post('/consultations/vacation', data).then((r) => r.data),

  getVacations: () =>
    apiClient.get('/consultations/vacation').then((r) => r.data),

  deleteVacation: (id: number) =>
    apiClient.delete(`/consultations/vacation/${id}`).then((r) => r.data),

  // C7: Flag a review
  flagReview: (reviewId: number, reason: string) =>
    apiClient.post(`/consultations/reviews/${reviewId}/flag`, { reason }).then((r) => r.data),

  // C12: Payout
  getMyEarnings: () =>
    apiClient.get('/consultations/earnings').then((r) => r.data),
  getMyPayoutRequests: () =>
    apiClient.get('/consultations/payouts').then((r) => r.data),
  requestPayout: (data: { amount: number; method?: string; accountDetails?: string }) =>
    apiClient.post('/consultations/payouts/request', data).then((r) => r.data),
  updatePayoutSettings: (data: { method: string; accountDetails: string }) =>
    apiClient.patch('/consultations/payout-settings', data).then((r) => r.data),
};

// ─── G5: Saved Searches ────────────────────────────────────────────────────────
export const savedSearchesApi = {
  getAll: () =>
    apiClient.get<any[]>('/saved-searches').then((r) => r.data),

  create: (name: string, filters: Record<string, unknown>) =>
    apiClient.post<any>('/saved-searches', { name, filters }).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/saved-searches/${id}`).then((r) => r.data),

  toggleAlert: (id: number) =>
    apiClient.patch<any>(`/saved-searches/${id}/toggle-alert`).then((r) => r.data),
};

export const priceAlertsApi = {
  getMyAlerts: () =>
    apiClient.get<any[]>('/price-alerts').then((r) => r.data),

  create: (propertyId: number, targetPrice: number) =>
    apiClient.post<any>('/price-alerts', { propertyId, targetPrice }).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/price-alerts/${id}`).then((r) => r.data),
};
