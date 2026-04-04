# 🔌 API Reference & Types

Complete guide to all implemented API endpoints and TypeScript types for Sakan platform.

---

## 📡 API Base URL

**Development**: `http://localhost:3001`  
**Production**: Set via environment variable

---

## 🏠 Properties API

### List Properties with Filters
```
GET /api/properties?query=&minPrice=&maxPrice=&bedrooms=&amenities=[]&spaceType=&sorting=
```

### Get Property Details
```
GET /api/properties/:id
```

Response includes:
- Basic info (title, description, price)
- Photos gallery
- Amenities (array of IDs)
- Availability calendar
- Host information
- Reviews and ratings

### Create Property (Host)
```
POST /api/properties
Body: {
  title: string
  description: string
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  pricePerNight: number
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: string[]
  photos: string[]
  spaceType: 'entire_place' | 'private_room' | 'shared_room'
}
```

### Update Property
```
PATCH /api/properties/:id
Body: Partial properties
```

### Delete Property
```
DELETE /api/properties/:id
```

---

## 📅 Bookings API

### Create Booking
```
POST /api/bookings
Body: {
  propertyId: string
  checkInDate: string (ISO 8601)
  checkOutDate: string (ISO 8601)
  numberOfGuests: number
  specialRequests?: string
  totalPrice: number
}
```

### Get User Bookings
```
GET /api/bookings/me
Query: status=upcoming|past|cancelled
```

### Get Host Reservations
```
GET /api/bookings/host/reservations
Query: status=pending|confirmed|completed|cancelled
```

### Get Booking Details
```
GET /api/bookings/:id
```

### Update Booking Status
```
PATCH /api/bookings/:id/status
Body: {
  status: 'confirmed' | 'declined' | 'cancelled'
}
```

### Cancel Booking
```
POST /api/bookings/:id/cancel
Body: {
  reason: string
}
```

---

## 🎯 Experiences API

### Browse Experiences
```
GET /api/experiences?query=&category=&minPrice=&maxPrice=&location=&rating=
```

### Get Experience Details
```
GET /api/experiences/:id
```

### Create Experience (Host Optional)
```
POST /api/experiences
Body: {
  title: string
  description: string
  category: string
  location: string
  latitude: number
  longitude: number
  pricePerPerson: number
  duration: number (hours)
  minGuests: number
  maxGuests: number
  photos: string[]
  schedule: string
  featured?: boolean
}
```

### Book Experience (NEW)
```
POST /api/experiences/bookings
Body: {
  experienceId: string
  date: string (ISO date)
  guests: number
  notes?: string
}
```

---

## 🔧 Services API

### Browse Services
```
GET /api/services?query=&category=&city=&minPrice=&maxPrice=&rating=
```

### Get Service Details
```
GET /api/services/:id
```

### Create Service
```
POST /api/services
Body: {
  title: string
  description: string
  category: string
  location: string
  priceType: 'per_hour' | 'per_service' | 'per_project' | 'per_month'
  price: number
  providerId: string
  rating: number
  reviews: number
}
```

### Book/Request Service (NEW)
```
POST /api/services/bookings
Body: {
  serviceId: string
  preferredDate?: string (ISO date - optional for remote)
  quantity: number
  notes?: string
}
```

---

## 💬 Messaging API

### Get Conversations
```
GET /api/messages/conversations
Query: limit=20&offset=0
```

### Get Conversation Messages
```
GET /api/messages/conversations/:id
Query: limit=50&offset=0
```

### Send Message
```
POST /api/messages
Body: {
  conversationId: string
  content: string
  attachments?: string[]
}
```

### Create Conversation
```
POST /api/messages/conversations
Body: {
  participantId: string
  propertyId?: string (optional)
  firstMessage: string
}
```

---

## 👤 Users API

### Get Current User
```
GET /api/users/me
```

### Update Profile
```
PATCH /api/users/profile
Body: {
  firstName?: string
  lastName?: string
  bio?: string
  avatar?: string
  phoneNumber?: string
}
```

### Get User Profile
```
GET /api/users/:id
```

### Change Password
```
POST /api/users/change-password
Body: {
  currentPassword: string
  newPassword: string
}
```

---

## ❤️ Wishlists API

### Get User Wishlists
```
GET /api/wishlists
```

### Create Wishlist
```
POST /api/wishlists
Body: {
  name: string
  description?: string
}
```

### Get Wishlist Details
```
GET /api/wishlists/:id
```

### Add Property to Wishlist
```
POST /api/wishlists/:id/properties/:propertyId
```

### Remove Property from Wishlist
```
DELETE /api/wishlists/:id/properties/:propertyId
```

### Delete Wishlist
```
DELETE /api/wishlists/:id
```

---

## ⭐ Reviews API

### Get Property Reviews
```
GET /api/reviews/properties/:propertyId
Query: limit=10&offset=0
```

### Create Review
```
POST /api/reviews
Body: {
  bookingId: string
  rating: number (1-5)
  comment: string
  categories?: {
    cleanliness: number
    accuracy: number
    communication: number
    location: number
    value: number
  }
}
```

### Update Review
```
PATCH /api/reviews/:id
Body: {
  rating?: number
  comment?: string
}
```

---

## 🔐 Authentication API

### Register
```
POST /api/auth/register
Body: {
  email: string
  password: string
  firstName: string
  lastName: string
}
```

### Login
```
POST /api/auth/login
Body: {
  email: string
  password: string
}
Response: {
  accessToken: string
  refreshToken: string
  user: User
}
```

### Refresh Token
```
POST /api/auth/refresh
Body: {
  refreshToken: string
}
```

### Logout
```
POST /api/auth/logout
```

---

## 📡 Amenities API

### Get All Amenities
```
GET /api/amenities
Query: category=&page=1&limit=50
```

### Get Amenity Categories
```
GET /api/amenities/categories
```

---

## 🏷️ Categories API

### Get All Categories
```
GET /api/categories
Query: type=property|experience|service
```

---

## 📊 Search API

### Advanced Search
```
GET /api/search/properties
Query: {
  query: string
  location: string
  checkIn: string (ISO date)
  checkOut: string (ISO date)
  guests: number
  minPrice: number
  maxPrice: number
  amenities: string[]
  spaceType: string
  bedrooms: number
  sortBy: 'popular' | 'price_asc' | 'price_desc' | 'rating'
}
```

---

## 🗂️ TypeScript Types

### Property Types
```typescript
interface Property {
  id: string
  title: string
  description: string
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  pricePerNight: number
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  spaceType: 'entire_place' | 'private_room' | 'shared_room'
  amenities: Amenity[]
  photos: Photo[]
  rating: number
  reviewCount: number
  host: User
  createdAt: string
  updatedAt: string
}

type PropertySpaceType = 'entire_place' | 'private_room' | 'shared_room'
type PropertyStatus = 'draft' | 'published' | 'archived'
```

### Booking Types
```typescript
interface Booking {
  id: string
  propertyId: string
  guestId: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  totalPrice: number
  status: BookingStatus
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
```

### Experience Types (NEW)
```typescript
interface Experience {
  id: string
  title: string
  description: string
  category: string
  location: string
  latitude: number
  longitude: number
  pricePerPerson: number
  duration: number
  minGuests: number
  maxGuests: number
  photos: string[]
  rating: number
  reviews: number
  featured: boolean
  createdAt: string
}

type ExperienceBookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface ExperienceBooking {
  id: string
  experienceId: string
  guestId: string
  date: string
  guests: number
  totalPrice: number
  notes?: string
  status: ExperienceBookingStatus
  createdAt: string
}

interface CreateExperienceBookingPayload {
  experienceId: string
  date: string
  guests: number
  notes?: string
}
```

### Service Types (NEW)
```typescript
type PriceType = 'per_hour' | 'per_service' | 'per_project' | 'per_month'

interface Service {
  id: string
  title: string
  description: string
  category: string
  location: string
  priceType: PriceType
  price: number
  providerId: string
  rating: number
  reviews: number
  createdAt: string
}

type ServiceBookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface ServiceBooking {
  id: string
  serviceId: string
  requesterId: string
  preferredDate?: string
  quantity: number
  totalPrice: number
  notes?: string
  status: ServiceBookingStatus
  createdAt: string
}

interface CreateServiceBookingPayload {
  serviceId: string
  preferredDate?: string
  quantity: number
  notes?: string
}
```

### User Types
```typescript
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  phoneNumber?: string
  isVerified: boolean
  isSuperhost: boolean
  rating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}

interface UserProfile extends User {
  hostListings?: Property[]
  hostReviews?: Review[]
}
```

### Message Types
```typescript
interface Conversation {
  id: string
  participants: User[]
  propertyId?: string
  lastMessage?: Message
  lastMessageTime: string
  unreadCount: number
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachments?: string[]
  createdAt: string
  isRead: boolean
}
```

### Review Types
```typescript
interface Review {
  id: string
  bookingId: string
  authorId: string
  propertyId: string
  rating: number
  comment: string
  categories?: {
    cleanliness: number
    accuracy: number
    communication: number
    location: number
    value: number
  }
  authorName: string
  authorAvatar?: string
  createdAt: string
}
```

### Wishlist Types
```typescript
interface Wishlist {
  id: string
  userId: string
  name: string
  description?: string
  properties: Property[]
  createdAt: string
  updatedAt: string
}
```

---

## 🔑 Authentication Headers

All authenticated requests require:
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

---

## ❌ Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `422`: Validation Error
- `500`: Server Error

---

## 🧪 Testing with cURL

### Get Properties
```bash
curl http://localhost:3001/api/properties \
  -H "Content-Type: application/json"
```

### Create Booking (Authenticated)
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "123",
    "checkInDate": "2026-04-01",
    "checkOutDate": "2026-04-05",
    "numberOfGuests": 2,
    "totalPrice": 500
  }'
```

### Book Experience (NEW)
```bash
curl -X POST http://localhost:3001/api/experiences/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "experienceId": "exp-123",
    "date": "2026-04-15",
    "guests": 2,
    "notes": "Looking forward to this!"
  }'
```

---

## 📚 Frontend Integration Examples

### Using the API in React (Next.js)
```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Get properties
export function useProperties(filters) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => api.properties.getAll(filters)
  })
}

// Create experience booking
export function useCreateExperienceBooking() {
  return useMutation({
    mutationFn: (payload) => api.experiencesApi.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    }
  })
}
```

---

## 🔗 API Documentation

Full interactive API docs available at:
```
http://localhost:3001/api/docs
```

(Swagger/OpenAPI specification)

---

**Last Updated**: March 19, 2026  
**API Version**: v1
