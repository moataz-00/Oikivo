import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  User,
  Property,
  PropertyListItem,
  PropertyPhoto,
  HouseRule,
  Booking,
  Review,
  Wishlist,
  Conversation,
  Message,
  Notification,
  Category,
  Amenity,
  PaginatedResponse,
  PriceBreakdown,
  Consultant,
  ConsultantPublicProfile,
  ConsultationSlotsResponse,
  ConsultationBooking,
  ConsultationDeliveryMode,
} from '../types';

// ─── iCal channel type ───────────────────────────────────────────────────────
export interface ICalChannel {
  id: number;
  propertyId: number;
  name: string;
  url: string;
  lastSyncAt?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001/api';
const TOKEN_KEY = 'oikivo_access_token';

// ---------------------------------------------------------------------------
// In-memory token cache (used by the sync interceptor so we don't have to
// await SecureStore on every request). Updated whenever login/logout occurs.
// ---------------------------------------------------------------------------

let memoryToken: string | null = null;

export function setMemoryToken(token: string | null) {
  memoryToken = token;
}

export function getMemoryToken(): string | null {
  return memoryToken;
}

// ---------------------------------------------------------------------------
// SecureStore helpers
// ---------------------------------------------------------------------------

export const tokenStorage = {
  get: async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) memoryToken = token;
      return token;
    } catch {
      return null;
    }
  },
  set: async (token: string): Promise<void> => {
    memoryToken = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  remove: async (): Promise<void> => {
    memoryToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Request interceptor -- attach Bearer token from memory cache
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (memoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor -- clear token on 401 only when a token was actually sent
// (prevents wiping stored token on pre-hydration unauthenticated requests)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && memoryToken) {
      await tokenStorage.remove();
    }
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ user: User; accessToken: string }>(
      '/auth/login',
      { email, password },
    );
    await tokenStorage.set(res.data.accessToken);
    return res.data;
  },

  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const res = await api.post<{ user: User; accessToken: string }>(
      '/auth/register',
      data,
    );
    await tokenStorage.set(res.data.accessToken);
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore errors on logout
    }
    await tokenStorage.remove();
  },
};

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export const propertiesApi = {
  getProperty: async (id: number): Promise<Property> => {
    const res = await api.get<Property>(`/properties/${id}`);
    return res.data;
  },

  getHostListings: async (page = 1, limit = 20): Promise<{ data: PropertyListItem[]; total: number }> => {
    const res = await api.get<{ data: PropertyListItem[]; total: number }>('/properties/host/listings', {
      params: { page, limit },
    });
    return res.data;
  },

  publish: async (id: number): Promise<Property> => {
    const res = await api.post<Property>(`/properties/${id}/publish`);
    return res.data;
  },

  unpublish: async (id: number): Promise<Property> => {
    const res = await api.post<Property>(`/properties/${id}/unpublish`);
    return res.data;
  },

  verifyListing: async (id: number): Promise<{ checks: Array<{ key: string; label: string; status: 'pass' | 'fail'; message?: string }> }> => {
    const res = await api.get(`/properties/${id}/verify`);
    return res.data;
  },

  updateHouseRules: async (
    id: number,
    rules: Array<{ rule: string; ruleAr?: string }>,
  ): Promise<void> => {
    await api.patch(`/properties/${id}/house-rules`, { rules });
  },

  updateAmenities: async (id: number, amenityIds: number[]): Promise<void> => {
    await api.patch(`/properties/${id}/amenities`, { amenityIds });
  },

  uploadPhotos: async (id: number, uris: string[]): Promise<PropertyPhoto[]> => {
    const formData = new FormData();
    uris.forEach((uri, idx) => {
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      formData.append('files', { uri, name: `photo_${idx}.${ext}`, type: mime } as any);
    });
    const res = await api.post<PropertyPhoto[]>(`/uploads/photos/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  setCoverPhoto: async (propertyId: number, photoId: number): Promise<void> => {
    await api.patch(`/uploads/photos/${propertyId}/${photoId}/cover`);
  },

  deletePhoto: async (propertyId: number, photoId: number): Promise<void> => {
    await api.delete(`/uploads/photos/${propertyId}/${photoId}`);
  },
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchParams {
  query?: string;
  city?: string;
  country?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  amenityIds?: number[];
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  instantBook?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export const searchApi = {
  searchProperties: async (
    params: SearchParams,
  ): Promise<PaginatedResponse<PropertyListItem>> => {
    const res = await api.get<PaginatedResponse<PropertyListItem>>(
      '/search',
      { params },
    );
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export const bookingsApi = {
  createBooking: async (data: {
    propertyId: number;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
  }): Promise<Booking> => {
    const res = await api.post<Booking>('/bookings', data);
    return res.data;
  },

  getMyTrips: async (
    status?: string,
  ): Promise<Booking[]> => {
    const res = await api.get<Booking[]>('/bookings/my-trips', {
      params: status ? { status } : {},
    });
    return res.data;
  },

  getHostReservations: async (
    status?: string,
  ): Promise<Booking[]> => {
    const res = await api.get<Booking[]>('/bookings/host-reservations', {
      params: status ? { status } : {},
    });
    return res.data;
  },

  confirmBooking: async (id: number): Promise<Booking> => {
    const res = await api.post<Booking>(`/bookings/${id}/confirm`);
    return res.data;
  },

  declineBooking: async (id: number): Promise<Booking> => {
    const res = await api.post<Booking>(`/bookings/${id}/decline`);
    return res.data;
  },

  cancelBooking: async (id: number): Promise<Booking> => {
    const res = await api.post<Booking>(`/bookings/${id}/cancel`);
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewsApi = {
  getPropertyReviews: async (
    propertyId: number,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<Review>> => {
    const res = await api.get<PaginatedResponse<Review>>(
      `/reviews/property/${propertyId}`,
      { params: { page, limit } },
    );
    return res.data;
  },

  createReview: async (data: {
    bookingId: number;
    overallRating: number;
    cleanlinessRating?: number;
    accuracyRating?: number;
    communicationRating?: number;
    locationRating?: number;
    valueRating?: number;
    checkinRating?: number;
    comment?: string;
  }): Promise<Review> => {
    const res = await api.post<Review>('/reviews', data);
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Consultations
// ---------------------------------------------------------------------------

export interface ConsultationSearchParams {
  search?: string;
  specialization?: string;
  minRating?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export const consultationsApi = {
  listConsultants: async (
    params: ConsultationSearchParams = {},
  ): Promise<PaginatedResponse<Consultant>> => {
    const res = await api.get<PaginatedResponse<Consultant>>(
      '/consultations/consultants',
      { params },
    );
    return res.data;
  },

  getConsultant: async (id: number): Promise<ConsultantPublicProfile> => {
    const res = await api.get<ConsultantPublicProfile>(
      `/consultations/consultants/${id}`,
    );
    return res.data;
  },

  getConsultantSlots: async (
    consultantId: number,
    date: string,
    durationMinutes = 60,
  ): Promise<ConsultationSlotsResponse> => {
    const res = await api.get<ConsultationSlotsResponse>(
      `/consultations/consultants/${consultantId}/slots`,
      { params: { date, durationMinutes } },
    );
    return res.data;
  },

  bookConsultation: async (data: {
    consultantId: number;
    durationMinutes: number;
    scheduledAt: string;
    deliveryMode?: ConsultationDeliveryMode;
    clientNote?: string;
    clientTimezone?: string;
  }): Promise<ConsultationBooking> => {
    const res = await api.post<ConsultationBooking>('/consultations/book', data);
    return res.data;
  },

  getMyBookings: async (
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<ConsultationBooking>> => {
    const res = await api.get<PaginatedResponse<ConsultationBooking>>(
      '/consultations/my-bookings',
      { params: { page, limit } },
    );
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Wishlists
// ---------------------------------------------------------------------------

export const wishlistsApi = {
  getWishlists: async (): Promise<Wishlist[]> => {
    const res = await api.get<Wishlist[]>('/wishlists');
    return res.data;
  },

  getWishlist: async (id: number): Promise<Wishlist> => {
    const res = await api.get<Wishlist>(`/wishlists/${id}`);
    return res.data;
  },

  createWishlist: async (name: string): Promise<Wishlist> => {
    const res = await api.post<Wishlist>('/wishlists', { name });
    return res.data;
  },

  addToWishlist: async (
    wishlistId: number,
    propertyId: number,
  ): Promise<void> => {
    await api.post(`/wishlists/${wishlistId}/items`, { propertyId });
  },

  removeFromWishlist: async (
    wishlistId: number,
    propertyId: number,
  ): Promise<void> => {
    await api.delete(`/wishlists/${wishlistId}/items/${propertyId}`);
  },

  checkWishlisted: async (
    propertyId: number,
  ): Promise<{ wishlisted: boolean; wishlistId?: number }> => {
    const res = await api.get<{ wishlisted: boolean; wishlistId?: number }>(
      `/wishlists/check/${propertyId}`,
    );
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const messagesApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get<Conversation[]>('/messages/conversations');
    return res.data;
  },

  getMessages: async (
    conversationId: number,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResponse<Message>> => {
    const res = await api.get<PaginatedResponse<Message>>(
      `/messages/conversations/${conversationId}/messages`,
      { params: { page, limit } },
    );
    return res.data;
  },

  sendMessage: async (
    conversationId: number,
    body: string,
  ): Promise<Message> => {
    const res = await api.post<Message>('/messages', {
      conversationId,
      body,
    });
    return res.data;
  },

  markRead: async (conversationId: number): Promise<void> => {
    await api.post(`/messages/conversations/${conversationId}/read`);
  },
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get<Category[]>('/categories');
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Amenities
// ---------------------------------------------------------------------------

export const amenitiesApi = {
  getAmenities: async (): Promise<Amenity[]> => {
    const res = await api.get<Amenity[]>('/amenities');
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const usersApi = {
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'bio' | 'preferredLanguage'>>): Promise<User> => {
    const res = await api.patch<User>('/users/me', data);
    return res.data;
  },

  becomeHost: async (): Promise<User> => {
    const res = await api.post<User>('/users/me/become-host');
    return res.data;
  },

  getPublicProfile: async (userId: number): Promise<User> => {
    const res = await api.get<User>(`/users/${userId}`);
    return res.data;
  },

  getUserListings: async (userId: number): Promise<PropertyListItem[]> => {
    const res = await api.get<{ data: PropertyListItem[] }>(`/users/${userId}/listings`);
    return res.data.data ?? res.data as any;
  },
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationsApi = {
  getNotifications: async (
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Notification>> => {
    const res = await api.get<PaginatedResponse<Notification>>(
      '/notifications',
      { params: { page, limit } },
    );
    return res.data;
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await api.get<{ count: number }>(
      '/notifications/unread-count',
    );
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export const availabilityApi = {
  getCalendar: async (
    propertyId: number,
    monthStr: string,
  ): Promise<{ date: string; available: boolean; price?: number }[]> => {
    const [year, month] = monthStr.split('-');
    const res = await api.get<
      { date: string; available: boolean; price?: number }[]
    >(`/availability/${propertyId}`, { params: { year, month: parseInt(month, 10) } });
    return res.data;
  },

  blockDates: async (data: {
    propertyId: number;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<void> => {
    await api.post(`/availability/${data.propertyId}/block`, {
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason ?? 'Blocked by host',
    });
  },

  setSeasonalPricing: async (data: {
    propertyId: number;
    startDate: string;
    endDate: string;
    pricePerNight: number;
  }): Promise<void> => {
    await api.post(`/availability/${data.propertyId}/seasonal-pricing`, {
      startDate: data.startDate,
      endDate: data.endDate,
      pricePerNight: data.pricePerNight,
    });
  },

  // iCal channel management (UX-07 / P1-08)
  getChannels: async (propertyId: number): Promise<ICalChannel[]> => {
    const res = await api.get<ICalChannel[]>(`/availability/${propertyId}/channels`);
    return res.data;
  },

  addChannel: async (propertyId: number, name: string, url: string): Promise<ICalChannel> => {
    const res = await api.post<ICalChannel>(`/availability/${propertyId}/channels`, { name, url });
    return res.data;
  },

  removeChannel: async (propertyId: number, sourceId: number): Promise<void> => {
    await api.delete(`/availability/${propertyId}/channels/${sourceId}`);
  },

  syncChannel: async (propertyId: number, sourceId: number): Promise<void> => {
    await api.post(`/availability/${propertyId}/channels/${sourceId}/sync`);
  },
};

// ---------------------------------------------------------------------------
// Payouts / Earnings
// ---------------------------------------------------------------------------

export interface EarningsSummary {
  summary: { total: number; available: number; pending: number; paid: number; currency: string };
  earnings: Array<{
    id: number;
    amount: number;
    status: 'available' | 'pending' | 'paid';
    availableAt: string;
    booking?: { id: number; checkIn: string; checkOut: string; guest?: { firstName: string; lastName: string } };
  }>;
}

export const payoutsApi = {
  getEarnings: async (): Promise<EarningsSummary> => {
    const res = await api.get<EarningsSummary>('/payouts/earnings');
    return res.data;
  },

  requestPayout: async (amount: number): Promise<void> => {
    await api.post('/payouts/request', { amount });
  },
};

// ---------------------------------------------------------------------------
// Host performance
// ---------------------------------------------------------------------------

export const hostMetricsApi = {
  // Returns an array of per-property performance metrics for the current host.
  // Pass an optional array of property IDs to scope the results.
  getPerformance: async (ids?: number[]): Promise<any[]> => {
    const params = ids?.length ? { ids: ids.join(',') } : undefined;
    const res = await api.get('/properties/host/compare', { params });
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Price breakdown helper (convenience)
// ---------------------------------------------------------------------------

export const priceApi = {
  getBreakdown: async (params: {
    propertyId: number;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
  }): Promise<PriceBreakdown> => {
    const res = await api.get<PriceBreakdown>('/bookings/price-breakdown', {
      params,
    });
    return res.data;
  },
};

export interface CoHostInvite {
  id: number;
  propertyId: number;
  property?: { id: number; title: string };
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
  respondedAt?: string | null;
  inviter?: { id: number; firstName: string; lastName: string; email: string };
}

export const cohostsApi = {
  // Host: list co-hosts for a property
  getCohosts: async (propertyId: number): Promise<CoHostInvite[]> => {
    const res = await api.get(`/cohosts?propertyId=${propertyId}`);
    return res.data;
  },
  // Host: invite a co-host
  invite: async (propertyId: number, email: string, role: string): Promise<CoHostInvite> => {
    const res = await api.post('/cohosts', { propertyId, email, role });
    return res.data;
  },
  // Host: remove co-host
  remove: async (cohostId: number): Promise<void> => {
    await api.delete(`/cohosts/${cohostId}`);
  },
  // Host: reinvite
  reinvite: async (cohostId: number): Promise<CoHostInvite> => {
    const res = await api.patch(`/cohosts/${cohostId}/reinvite`);
    return res.data;
  },
  // Co-host: list my incoming invites
  getMyInvites: async (): Promise<CoHostInvite[]> => {
    const res = await api.get('/cohosts/my-invites');
    return res.data;
  },
  // Co-host: respond to invite
  respond: async (cohostId: number, accept: boolean): Promise<CoHostInvite> => {
    const res = await api.patch(`/cohosts/${cohostId}/respond`, { status: accept ? 'accepted' : 'declined' });
    return res.data;
  },
};

export default api;
