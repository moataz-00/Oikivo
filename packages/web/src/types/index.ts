// ─── User ────────────────────────────────────────────────────────────────────
export type UserRole = 'guest' | 'host' | 'hotel_manager' | 'agent' | 'admin';

export interface User {
  id: number;
  profileUuid?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  bio?: string | null;
  phone?: string | null;
  isSuperhost: boolean;
  isHost?: boolean;
  isAdmin?: boolean;
  isConsultant?: boolean;
  isActive?: boolean;
  isIdentityVerified: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isIdVerified?: boolean;
  dateOfBirth?: string | null;
  preferredLanguage?: 'en' | 'ar';
  joinedAt: string;
  createdAt?: string;
  reviewCount?: number;
  avgRating?: number | null;
  googleId?: string | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  slug: string;
}

// ─── Amenity ─────────────────────────────────────────────────────────────────
export type AmenityGroup = 'essential' | 'standout' | 'safety';

export interface Amenity {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  group: AmenityGroup;
}

// ─── Property ────────────────────────────────────────────────────────────────
export type PropertyType = 'short_term_rental' | 'hotel' | 'for_sale';
export type SpaceType = 'entire_place' | 'private_room' | 'shared_room';
export type PropertyStatus = 'draft' | 'published' | 'archived' | 'pending_review';
export type PropertyKind =
  | 'apartment'
  | 'house'
  | 'villa'
  | 'cabin'
  | 'hotel'
  | 'chalet'
  | 'studio'
  | 'loft'
  | 'hotel_room'
  | 'bungalow'
  | 'cottage'
  | 'townhouse';

export interface PropertyImage {
  id: number;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface Property {
  id: number;
  uuid: string;
  title: string;
  description: string;
  type: PropertyType;
  spaceType: SpaceType;
  kind: PropertyKind;
  status: PropertyStatus;
  price: number;
  weekendPrice?: number | null;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  cleaningFee: number;
  securityDeposit?: number;
  serviceFeePercent: number;
  minNights: number;
  maxNights: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  avgRating: number | null;
  reviewCount: number;
  instantBook: boolean;
  allowPets: boolean;
  images: PropertyImage[];
  amenities: Amenity[];
  host: User;
  category?: Category;
  houseRules?: string;
  allowsSmoking?: boolean;
  allowsParties?: boolean;
  allowsChildren?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  currency?: string;
  newListingPromotionEnabled?: boolean;
  lastMinuteDiscountPercent?: number;
  bookingMode?: string;
  createdAt: string;
  archivedAt?: string | null;
}

export interface SearchPropertiesParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  type?: PropertyType;
  spaceType?: SpaceType;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities?: number[];
  instantBook?: boolean;
  allowPets?: boolean;
  categoryId?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  listingType?: 'stay' | 'experience';
}

export interface PaginatedProperties {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PricePreview {
  nights: number;
  pricePerNight: number;
  weekendPrice?: number | null;
  baseAmount: number;
  discountPercent?: number;
  discountAmount?: number;
  discountedBase?: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency?: string;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  type: PropertyType;
  spaceType: SpaceType;
  kind: PropertyKind;
  price?: number;
  weekendPrice?: number;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  cleaningFee?: number;
  securityDeposit?: number;
  minNights?: number;
  maxNights?: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  amenityIds?: number[];
  categoryId?: number;
  houseRules?: string;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  instantBook?: boolean;
  allowPets?: boolean;
  allowsSmoking?: boolean;
  allowsParties?: boolean;
  allowsChildren?: boolean;
}

// ─── Booking ─────────────────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'declined';
export type PaymentStatus = 'pending' | 'submitted' | 'paid' | 'refunded' | 'declined';
export type PaymentMethod = 'instapay' | 'cash' | 'card' | 'stripe' | 'opay-card';

export interface Booking {
  id: number;
  bookingUuid?: string;
  currency?: string;
  property: Property;
  guest: User;
  host?: User;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  guestsCount?: number;
  basePrice: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  totalAmount?: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  paymentNote?: string | null;
  message?: string | null;
  createdAt: string;
  cancellationPolicy?: string | null;
  cancellationReason?: string | null;
  refundAmount?: number;
  cancellationFee?: number;
  cancelledAt?: string | null;
  cancelledBy?: 'guest' | 'host' | 'admin' | 'system' | null;
  depositAmount?: number;
  depositStatus?: 'none' | 'held' | 'claimed' | 'released';
  depositClaimDeadline?: string | null;
}

export interface CreateBookingPayload {
  propertyId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  message?: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────
export interface Review {
  id: number;
  rating: number;
  overallRating?: number;
  comment: string;
  hostReply?: string | null;
  reviewer: User;
  property?: Property;
  createdAt: string;
  // Detailed sub-ratings
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  checkinRating?: number;
}

export interface CreateReviewPayload {
  bookingId: number;
  overallRating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  checkinRating?: number;
  comment?: string;
  photos?: string[];
}

export interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  cleanliness: number;
  accuracy: number;
  checkIn: number;
  communication: number;
  location: number;
  value: number;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export interface Wishlist {
  id: number;
  name: string;
  user: User;
  properties: Property[];
  coverImage?: string | null;
  count: number;
  createdAt: string;
}

// ─── Message & Conversation ───────────────────────────────────────────────────
export interface Message {
  id: number;
  conversationId?: number;
  content: string;
  messageType: 'text' | 'image';
  imageUrl?: string | null;
  sender: User;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: number;
  guestId?: number;
  hostId?: number;
  participants: User[];
  property?: Property;
  experience?: { id: number; uuid: string; title: string };
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'new_message'
  | 'new_review'
  | 'payment';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── Availability ─────────────────────────────────────────────────────────────
export type DayStatus = 'available' | 'booked' | 'blocked';

export interface CalendarDay {
  date: string;
  status: DayStatus;
  price?: number;
  booking?: Partial<Booking>;
}

export interface BlockDatesPayload {
  propertyId: number;
  dates: string[];
  reason?: string;
  priceOverride?: number;
}

// ─── iCal / Channel Manager ───────────────────────────────────────────────────
export type ICalSyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export interface ICalSource {
  id: number;
  propertyId: number;
  label: string;
  url: string;
  syncStatus: ICalSyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

// ─── Popular City ─────────────────────────────────────────────────────────────
export interface PopularCity {
  city: string;
  country: string;
  image: string;
  propertyCount: number;
  lat: number;
  lng: number;
}

// ─── API Response wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    hosts: number;
    guests: number;
    newThisMonth: number;
    newThisWeek: number;
  };
  properties: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    todayCheckIns: number;
    todayCheckOuts: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    currency: string;
  };
  recentBookings: AdminBooking[];
  topProperties: AdminProperty[];
}

export interface AdminUser extends User {
  id: number;
  email: string;
  isHost: boolean;
  isAdmin: boolean;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isSuperhost: boolean;
  createdAt: string;
  bookingCount?: number;
  propertyCount?: number;
}

export interface AdminProperty {
  id: number;
  title: string;
  city: string;
  country: string;
  status: PropertyStatus;
  price: number;
  avgRating: number | null;
  reviewCount: number;
  bookingCount?: number;
  host: Partial<User>;
  createdAt: string;
  images?: PropertyImage[];
}

export interface AdminBooking {
  id: number;
  property: Partial<Property>;
  guest: Partial<User>;
  host?: Partial<User>;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  total?: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface AdminPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RevenueChartPoint {
  month: string;
  revenue: number;
  bookings: number;
}

// ─── Earnings & Payouts ───────────────────────────────────────────────────────
export type EarningStatus = 'pending' | 'available' | 'paid';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'instapay' | 'bank_transfer' | 'cash';

export interface Earning {
  id: number;
  hostId: number;
  bookingId: number;
  booking?: Partial<Booking> & { property?: Partial<Property> };
  amount: number;
  platformFee: number;
  currency: string;
  status: EarningStatus;
  availableAt: string | null;
  createdAt: string;
}

export interface Payout {
  id: number;
  hostId: number;
  amount: number;
  currency: string;
  method: PayoutMethod;
  accountDetails: string | null;
  status: PayoutStatus;
  note: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface EarningsSummary {
  total: number;
  available: number;
  pending: number;
  paid: number;
  currency: string;
}

export interface EarningsResponse {
  summary: EarningsSummary;
  monthly: Array<{ month: string; amount: number }>;
  earnings: Earning[];
}

export interface RequestPayoutPayload {
  amount: number;
  method: PayoutMethod;
  accountDetails: string;
  note?: string;
}

// ─── Host Analytics ───────────────────────────────────────────────────────────
export interface HostAnalyticsTotals {
  bookings: number;
  byStatus: Record<string, number>;
  revenue: number;
  baseRevenue: number;
  cleaningFees: number;
  serviceFees: number;
  nights: number;
  avgBookingValue: number;
  completionRate: number;
  thisMonthBookings: number;
  thisMonthRevenue: number;
}

export interface HostAnalyticsPropertyRow {
  id: number;
  title: string;
  image: string | null;
  bookings: number;
  revenue: number;
  nights: number;
}

export interface HostAnalytics {
  totals: HostAnalyticsTotals;
  monthly: Array<{ month: string; bookings: number; revenue: number }>;
  byProperty: HostAnalyticsPropertyRow[];
}

// ─── Co-host ──────────────────────────────────────────────────────────────────
export type CohostRole = 'co_host' | 'cleaner';
export type CohostStatus = 'pending' | 'accepted' | 'declined';

export interface CoHost {
  id: number;
  propertyId: number;
  hostId: number;
  cohostId: number;
  cohost: Partial<User>;
  role: CohostRole;
  status: CohostStatus;
  createdAt: string;
}

export interface InviteCohostPayload {
  email: string;
  role?: CohostRole;
}

// ─── Experiences ──────────────────────────────────────────────────────────────
export type ExperienceStatus = 'draft' | 'published' | 'archived';

export interface ExperienceCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
}

export interface ExperiencePhoto {
  id: number;
  url: string;
  displayOrder: number;
  isCover: boolean;
}

export interface ExperienceItineraryStep {
  id?: number;
  stepNumber: number;
  title: string;
  description: string | null;
  durationMinutes: number | null;
}

export interface ExperienceScheduleSlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
}

export interface Experience {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  whatWellDo: string | null;
  whatIWillProvide: string | null;
  guestRequirements: string | null;
  language: string;
  durationMinutes: number;
  maxGuests: number;
  minGuests: number;
  pricePerPerson: number;
  groupDiscountPercent: number;
  city: string;
  address: string | null;
  country: string;
  lat: number;
  lng: number;
  meetingPoint: string | null;
  instantBook: boolean;
  status: ExperienceStatus;
  avgRating: number | null;
  reviewCount: number;
  totalBookings: number;
  photos: ExperiencePhoto[];
  itinerary: ExperienceItineraryStep[];
  schedule: ExperienceScheduleSlot[];
  host: User;
  category: ExperienceCategory | null;
  createdAt: string;
  archivedAt: string | null;
}

export interface SearchExperiencesParams {
  city?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  language?: string;
  date?: string;
  instantBook?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedExperiences {
  items: Experience[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExperiencePricePreview {
  pricePerPerson: number;
  subtotal: number;
  discountAmount: number;
  serviceFee: number;
  totalAmount: number;
}

export interface CreateExperiencePayload {
  title: string;
  description?: string;
  categoryId?: number;
  whatWellDo?: string;
  whatIWillProvide?: string;
  guestRequirements?: string;
  language?: string;
  durationMinutes?: number;
  maxGuests?: number;
  minGuests?: number;
  pricePerPerson: number;
  groupDiscountPercent?: number;
  city: string;
  address?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  meetingPoint?: string;
  instantBook?: boolean;
  itinerary?: Array<{ stepNumber: number; title: string; description?: string; durationMinutes?: number }>;
  schedule?: Array<{ dayOfWeek: number; startTime: string; endTime?: string }>;
}

// ─── Experience Booking ───────────────────────────────────────────────────────
export type ExperienceBookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined';

export interface ExperienceBooking {
  id: number;
  experience: Experience;
  guest: User;
  host: User;
  bookingDate: string;
  startTime: string;
  guestsCount: number;
  pricePerPerson: number;
  subtotal: number;
  discountAmount: number;
  serviceFee: number;
  totalAmount: number;
  status: ExperienceBookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  guestNote: string | null;
  cancellationReason: string | null;
  review?: ExperienceReview | null;
  createdAt: string;
}

export interface CreateExperienceBookingPayload {
  experienceId: number;
  bookingDate: string;
  startTime: string;
  guestsCount: number;
  guestNote?: string;
}

// ─── Experience Review ────────────────────────────────────────────────────────
export interface ExperienceReview {
  id: number;
  overallRating: number;
  hostRating: number | null;
  valueRating: number | null;
  activityRating: number | null;
  comment: string | null;
  hostReply: string | null;
  reviewer: User;
  experience?: Experience;
  createdAt: string;
}

export interface CreateExperienceReviewPayload {
  bookingId: number;
  overallRating: number;
  hostRating?: number;
  valueRating?: number;
  activityRating?: number;
  comment?: string;
}

export interface ExperienceReviewStats {
  avgOverall: number;
  avgHost: number;
  avgValue: number;
  avgActivity: number;
  totalReviews: number;
}
