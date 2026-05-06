export type Language = 'en' | 'ar';
export type SpaceType = 'entire_place' | 'private_room' | 'shared_room';
export type PropertyStatus = 'draft' | 'published' | 'pending_review' | 'archived';
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type AmenityCategory = 'essential' | 'standout' | 'safety';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  isHost: boolean;
  isSuperhost: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  idVerificationStatus?: 'none' | 'pending' | 'approved' | 'rejected' | null;
  idDocumentType?: 'national_id' | 'passport' | null;
  isAdmin: boolean;
  isConsultant?: boolean;
  preferredLanguage: Language;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
}

export interface HouseRule {
  id: number;
  rule: string;
  ruleAr?: string;
}

export interface Amenity {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  category: AmenityCategory;
}

export interface PropertyPhoto {
  id: number;
  url: string;
  caption?: string;
  displayOrder: number;
  isCover: boolean;
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

export interface Property extends PropertyListItem {
  hostId: number;
  host: Pick<
    User,
    'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'isSuperhost' | 'createdAt'
  >;
  description?: string;
  propertyKind: string;
  cleaningFee: number;
  serviceFeePercent: number;
  minNights: number;
  maxNights: number;
  bathrooms: number;
  address?: string;
  state?: string;
  countryCode?: string;
  checkInAfter: string;
  checkOutBefore: string;
  allowsPets: boolean;
  allowsSmoking: boolean;
  allowsParties: boolean;
  allowsChildren: boolean;
  status: PropertyStatus;
  photos: PropertyPhoto[];
  amenities: Amenity[];
  houseRules: HouseRule[];
  cancellationPolicy?: CancellationPolicy;
  bookingMode?: 'instant_book' | 'approve_first_three' | 'always_approve';
  approvedBookingsCount?: number;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  weekendPrice?: number;
  newListingPromotionEnabled?: boolean;
  lastMinuteDiscountPercent?: number;
  categoryId?: number;
}

export interface Booking {
  id: number;
  propertyId: number;
  property: {
    id: number;
    title: string;
    city: string;
    country: string;
    photos: PropertyPhoto[];
    host: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  };
  guestId: number;
  guest: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
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
  createdAt: string;
}

export interface Review {
  id: number;
  reviewerId: number;
  reviewer: Pick<
    User,
    'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'createdAt'
  >;
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
  createdAt: string;
}

export interface Conversation {
  id: number;
  property?: {
    id: number;
    title: string;
    photos: PropertyPhoto[];
  };
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

export interface WishlistItem {
  id: number;
  propertyId: number;
  property: PropertyListItem;
  createdAt: string;
}

export interface Wishlist {
  id: number;
  name: string;
  coverPhoto?: string;
  itemCount: number;
  items?: WishlistItem[];
  createdAt: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export type ConsultationDeliveryMode =
  | 'video_call'
  | 'in_person'
  | 'phone'
  | 'chat';

export interface Consultant {
  id: number;
  uuid: string;
  userId: number;
  displayName: string;
  bio?: string;
  specializations?: string[];
  yearsExperience: number;
  languages?: string[];
  hourlyRate: number | string;
  currency: string;
  avgRating: number | string;
  reviewCount: number;
  totalSessions: number;
  status: string;
  timezone?: string;
  isFeatured?: boolean;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
}

export interface ConsultantAvailabilitySlot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ConsultationReview {
  id: number;
  bookingId: number;
  reviewerId: number;
  consultantId: number;
  overallRating: number;
  expertiseRating?: number;
  communicationRating?: number;
  valueRating?: number;
  comment?: string;
  createdAt: string;
  reviewer?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
}

export interface ConsultantPublicProfile {
  consultant: Consultant;
  reviews: ConsultationReview[];
  availability: ConsultantAvailabilitySlot[];
}

export interface ConsultationSlotsResponse {
  slots: string[];
  consultantTimezone: string;
}

export interface ConsultationBooking {
  id: number;
  consultantId: number;
  clientId: number;
  consultant?: Consultant;
  client?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  scheduledAt: string;
  durationMinutes: number;
  price: number | string;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  meetingLink?: string;
  clientNote?: string;
  consultantNote?: string;
  deliveryMode: ConsultationDeliveryMode;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
