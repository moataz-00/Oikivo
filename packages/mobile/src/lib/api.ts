import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  User,
  Property,
  PropertyListItem,
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
} from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001/api';
const TOKEN_KEY = 'sakan_access_token';

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

  getHostListings: async (): Promise<PropertyListItem[]> => {
    const res = await api.get<PropertyListItem[]>('/properties/my-listings');
    return res.data;
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
      '/properties/search',
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
// Wishlists
// ---------------------------------------------------------------------------

export const wishlistsApi = {
  getWishlists: async (): Promise<Wishlist[]> => {
    const res = await api.get<Wishlist[]>('/wishlists');
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
    await api.post(`/wishlists/${wishlistId}/properties/${propertyId}`);
  },

  removeFromWishlist: async (
    wishlistId: number,
    propertyId: number,
  ): Promise<void> => {
    await api.delete(`/wishlists/${wishlistId}/properties/${propertyId}`);
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
    month: string,
  ): Promise<{ date: string; available: boolean; price?: number }[]> => {
    const res = await api.get<
      { date: string; available: boolean; price?: number }[]
    >(`/availability/${propertyId}`, { params: { month } });
    return res.data;
  },

  blockDates: async (data: {
    propertyId: number;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<void> => {
    await api.post('/availability/block', data);
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

export default api;
