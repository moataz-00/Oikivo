// ============================================================
// Sakan — Shared TypeScript Types
// ============================================================

// ---------- Enums ----------

export type Language = 'en' | 'ar';

export type SpaceType = 'entire_place' | 'private_room' | 'shared_room';

export type PropertyStatus = 'draft' | 'published' | 'archived';

export type PropertyKind =
  | 'apartment' | 'house' | 'villa' | 'cabin' | 'hotel'
  | 'guesthouse' | 'hostel' | 'resort' | 'studio' | 'loft'
  | 'townhouse' | 'cottage' | 'bungalow' | 'tent' | 'boat';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type AmenityCategory = 'essential' | 'standout' | 'safety';

export type WishlistVisibility = 'private' | 'public';

export type CoHostRole = 'co_host' | 'cleaner';

export type CoHostStatus = 'pending' | 'accepted' | 'declined';

export type NotificationType =
  | 'booking_requested'
  | 'booking_confirmed'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'new_message'
  | 'review_received'
  | 'review_reply'
  | 'cohost_invite'
  | 'superhost_achieved'
  | 'payout_sent';

// ---------- Core Entities ----------

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  isHost: boolean;
  isSuperhost: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  isAdmin: boolean;
  isActive: boolean;
  preferredLanguage: Language;
  createdAt: string;
}

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Amenity {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  category: AmenityCategory;
  sortOrder: number;
}

export interface PropertyPhoto {
  id: number;
  propertyId: number;
  url: string;
  caption?: string;
  displayOrder: number;
  isCover: boolean;
}

export interface HouseRule {
  id: number;
  propertyId: number;
  rule: string;
  ruleAr?: string;
}

export interface Property {
  id: number;
  hostId: number;
  host: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'isSuperhost' | 'isIdVerified' | 'createdAt'>;
  categoryId?: number;
  category?: Category;
  title: string;
  description?: string;
  spaceType: SpaceType;
  propertyKind: PropertyKind;
  pricePerNight: number;
  currency: string;
  cleaningFee: number;
  serviceFeePercent: number;
  minNights: number;
  maxNights: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  checkInAfter: string;
  checkOutBefore: string;
  allowsPets: boolean;
  allowsSmoking: boolean;
  allowsParties: boolean;
  allowsChildren: boolean;
  instantBook: boolean;
  isActive: boolean;
  status: PropertyStatus;
  avgRating: number;
  reviewCount: number;
  photos: PropertyPhoto[];
  amenities: Amenity[];
  houseRules: HouseRule[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyListItem {
  id: number;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  currency: string;
  avgRating: number;
  reviewCount: number;
  coverPhoto?: string;
  instantBook: boolean;
  isSuperhost: boolean;
  latitude?: number;
  longitude?: number;
  spaceType: SpaceType;
  maxGuests: number;
  bedrooms: number;
  beds: number;
}

export interface Booking {
  id: number;
  propertyId: number;
  property: Pick<Property, 'id' | 'title' | 'city' | 'country' | 'photos' | 'host'>;
  guestId: number;
  guest: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  hostId: number;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  nights: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  cancellationReason?: string;
  guestNote?: string;
  specialRequests?: string;
  createdAt: string;
}

export interface Review {
  id: number;
  bookingId: number;
  reviewerId: number;
  reviewer: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'createdAt'>;
  propertyId: number;
  overallRating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  checkinRating?: number;
  comment?: string;
  hostReply?: string;
  hostRepliedAt?: string;
  createdAt: string;
}

export interface ReviewStats {
  avgOverall: number;
  avgCleanliness: number;
  avgAccuracy: number;
  avgCommunication: number;
  avgLocation: number;
  avgValue: number;
  avgCheckin: number;
  total: number;
}

export interface Conversation {
  id: number;
  propertyId?: number;
  property?: Pick<Property, 'id' | 'title' | 'photos'>;
  bookingId?: number;
  hostId: number;
  guestId: number;
  otherUser: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Wishlist {
  id: number;
  userId: number;
  name: string;
  visibility: WishlistVisibility;
  coverPhoto?: string;
  itemCount: number;
  items?: WishlistItem[];
  createdAt: string;
}

export interface WishlistItem {
  id: number;
  wishlistId: number;
  property: PropertyListItem;
  addedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface Availability {
  date: string;
  isBlocked: boolean;
  priceOverride?: number;
}

// ---------- Request / Response DTOs ----------

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  preferredLanguage?: Language;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SearchDto {
  location?: string;
  city?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBeds?: number;
  minBathrooms?: number;
  spaceType?: SpaceType;
  propertyKind?: PropertyKind;
  instantBook?: boolean;
  allowsPets?: boolean;
  amenityIds?: number[];
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency: string;
}

export interface CreateBookingDto {
  propertyId: number;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  guestNote?: string;
  specialRequests?: string;
}

export interface CreateReviewDto {
  bookingId: number;
  overallRating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  checkinRating?: number;
  comment?: string;
}

export interface CreateMessageDto {
  conversationId?: number;
  propertyId?: number;
  hostId?: number;
  body: string;
}

export interface CreateListingDto {
  categoryId?: number;
  title: string;
  description?: string;
  spaceType: SpaceType;
  propertyKind: PropertyKind;
  pricePerNight: number;
  currency?: string;
  cleaningFee?: number;
  minNights?: number;
  maxNights?: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  address?: string;
  city: string;
  state?: string;
  country: string;
  countryCode?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  checkInAfter?: string;
  checkOutBefore?: string;
  allowsPets?: boolean;
  allowsSmoking?: boolean;
  allowsParties?: boolean;
  instantBook?: boolean;
  amenityIds?: number[];
}

// ---------- Constants ----------

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'EGP', 'AED', 'SAR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PROPERTY_KINDS: PropertyKind[] = [
  'apartment', 'house', 'villa', 'cabin', 'hotel',
  'guesthouse', 'hostel', 'resort', 'studio', 'loft',
  'townhouse', 'cottage', 'bungalow', 'tent', 'boat',
];

export const MAX_PHOTOS_PER_PROPERTY = 20;
export const MAX_GUESTS_LIMIT = 16;
export const MAX_NIGHTS_LIMIT = 365;

export const SERVICE_FEE_PERCENT = 14;
export const TAX_PERCENT = 4;

// ============================================================
// Consultation Marketplace Types
// ============================================================

export type ConsultantStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ConsultationCategory =
  | 'listing_optimization'
  | 'pricing_strategy'
  | 'interior_design'
  | 'guest_experience'
  | 'photography'
  | 'superhost_coaching'
  | 'property_management'
  | 'legal_compliance'
  | 'marketing'
  | 'revenue_management'
  | 'general';

export type ConsultationDeliveryMode = 'video_call' | 'in_person' | 'phone' | 'chat';

export type ConsultationBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'disputed';

export interface Consultant {
  id: number;
  uuid: string;
  userId: number;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'isSuperhost'>;
  displayName: string;
  bio?: string;
  specializations: string[];
  yearsExperience: number;
  languages: string[];
  hourlyRate: number;
  currency: string;
  avgRating: number;
  reviewCount: number;
  totalSessions: number;
  status: ConsultantStatus;
  isFeatured: boolean;
  createdAt: string;
}

export interface ConsultationService {
  id: number;
  uuid: string;
  consultantId: number;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  category: ConsultationCategory;
  durationMinutes: number;
  price: number;
  currency: string;
  deliveryMode: ConsultationDeliveryMode;
  isActive: boolean;
}

export interface ConsultationBooking {
  id: number;
  uuid: string;
  serviceId: number;
  service: ConsultationService;
  consultantId: number;
  consultant: Consultant;
  clientId: number;
  client: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  platformFee: number;
  consultantPayout: number;
  currency: string;
  status: ConsultationBookingStatus;
  paymentStatus: PaymentStatus;
  meetingLink?: string;
  clientNote?: string;
  consultantNote?: string;
  createdAt: string;
}

export interface ConsultationReview {
  id: number;
  bookingId: number;
  reviewerId: number;
  reviewer: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  consultantId: number;
  overallRating: number;
  expertiseRating?: number;
  communicationRating?: number;
  valueRating?: number;
  comment?: string;
  consultantReply?: string;
  createdAt: string;
}

export const CONSULTATION_FEE_PERCENT = 10; // 10% from consultant + 10% from client

export const CONSULTATION_CATEGORIES: { value: ConsultationCategory; labelEn: string; labelAr: string }[] = [
  { value: 'listing_optimization', labelEn: 'Listing Optimization', labelAr: 'تحسين الإعلان' },
  { value: 'pricing_strategy', labelEn: 'Pricing Strategy', labelAr: 'استراتيجية التسعير' },
  { value: 'interior_design', labelEn: 'Interior Design', labelAr: 'التصميم الداخلي' },
  { value: 'guest_experience', labelEn: 'Guest Experience', labelAr: 'تجربة الضيوف' },
  { value: 'photography', labelEn: 'Photography', labelAr: 'التصوير' },
  { value: 'superhost_coaching', labelEn: 'Superhost Coaching', labelAr: 'تدريب المضيف المتميز' },
  { value: 'property_management', labelEn: 'Property Management', labelAr: 'إدارة العقارات' },
  { value: 'legal_compliance', labelEn: 'Legal Compliance', labelAr: 'الامتثال القانوني' },
  { value: 'marketing', labelEn: 'Marketing', labelAr: 'التسويق' },
  { value: 'revenue_management', labelEn: 'Revenue Management', labelAr: 'إدارة الإيرادات' },
  { value: 'general', labelEn: 'General Consultation', labelAr: 'استشارة عامة' },
];
