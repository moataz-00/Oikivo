# Sakan (سكن) — Find Your Perfect Stay

> An Airbnb-clone marketplace for short-term rentals, built with NestJS, Next.js, React Native, and MySQL.

---

## Company
**Sakan** (سكن) is an Arabic word meaning *home / dwelling / residence*.
- Tagline (EN): *Find Your Perfect Stay*
- Tagline (AR): *ابحث عن مكانك المثالي*

---

## Architecture

```
sakan/
├── database/           # MySQL schema + seed data
├── packages/
│   ├── shared/         # TypeScript types shared across packages
│   ├── backend/        # NestJS REST API (port 3001)
│   ├── web/            # Next.js unified website — guests & hosts (port 3000)
│   └── mobile/         # Expo React Native app
└── package.json        # npm workspaces root
```

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Backend  | NestJS 10, TypeORM 0.3, MySQL2, JWT, Multer, Swagger |
| Website  | Next.js 14 (App Router), Tailwind CSS 3, shadcn/ui, next-intl |
| Mobile   | Expo 51, React Native 0.74, Expo Router 3, NativeWind 4 |
| Database | MySQL / MariaDB (via XAMPP) |
| Maps     | Google Maps API |
| Auth     | JWT + Refresh Tokens |

---

## Features

### For Guests
- Search by location, dates, guests with full filter support
- Category browsing (beachfront, cabins, pools, iconic cities…)
- Property detail with photo gallery, amenities, reviews, map
- Availability calendar & booking flow with price breakdown
- Instant Book and Request to Book
- Trips dashboard (upcoming, past, cancelled)
- Wishlists (save and organize properties)
- Messaging with hosts
- Review system (post-stay)
- Profile and account management
- Arabic / English language support (RTL/LTR)

### For Hosts (same website, host mode toggle)
- "Switch to hosting" mode like Airbnb
- Multi-step listing wizard
- Calendar & dynamic pricing management
- Booking approval / decline
- Earnings dashboard
- Superhost system
- Co-host invitations
- Reviews & responses

---

## Getting Started

### Prerequisites
- Node.js 20+
- XAMPP (MySQL/MariaDB running on port 3306)
- Google Maps API key

### 1. Database Setup
```bash
# In your MySQL client or phpMyAdmin:
# 1. Create database: marketplace_db
# 2. Run: database/schema.sql
# 3. Run: database/seeds.sql
```

### 2. Backend
```bash
cd packages/backend
cp .env.example .env
# Fill in your .env values
npm install
npm run dev
# API: http://localhost:3001/api
# Swagger: http://localhost:3001/api/docs
```

### 3. Website
```bash
cd packages/web
cp .env.local.example .env.local
# Fill in your .env.local values
npm install
npm run dev
# Site: http://localhost:3000
```

### 4. Mobile
```bash
cd packages/mobile
cp .env.example .env
npm install
npx expo start
```

---

## Environment Variables

### Backend (`packages/backend/.env`)
```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=sakan_db
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
PORT=3001
UPLOAD_PATH=./uploads
GOOGLE_MAPS_API_KEY=your-google-maps-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Journey Stay <no-reply@journeystay.com>
HOST_ACTIVATION_SECRET=your-host-activation-secret
HOST_ACTIVATION_EXPIRES_IN=24h
```

### Website (`packages/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

---

## API Documentation
Swagger UI available at `http://localhost:3001/api/docs` when backend is running.
