# Oikivo — Feasibility Study & Growth Roadmap

---

## What Oikivo Is (Current Phase 1)

A property rental marketplace for Egypt/MENA — hosts list properties, guests book them.
Backend already has: bookings, experiences, consultations, reviews, disputes, messaging, payments.

---

## COSTS

### One-Time Setup (Already Partially Done)

| Item | Est. Cost (EGP) |
|---|---|
| Development (you're building it) | 0–50,000 |
| UI/UX Design | 5,000–15,000 |
| Logo & branding | 2,000–5,000 |
| App Store / Play Store fees | ~1,500/yr |
| Legal registration (company) | 3,000–8,000 |
| Domain + SSL | 500/yr |
| **Total one-time** | **~12,000–80,000** |

### Monthly Running Costs

| Item | Est. Cost (EGP/month) |
|---|---|
| VPS / Cloud server (DigitalOcean/AWS) | 500–2,000 |
| Database backups & storage | 200–500 |
| Email service (SendGrid/Mailgun) | 100–300 |
| WhatsApp OTP (t7km Plus) | 200–800 |
| SMS fallback | 100–400 |
| Google Maps API | 300–1,000 |
| CDN (Cloudflare/BunnyCDN) | 100–500 |
| **Total monthly** | **~1,500–5,500** |

---

## REVENUE — Phase 1 (Live Now)

### 1. Guest Booking Commission ✅
**Most powerful model — zero extra cost**

- Charge 8–12% on every booking from guest
- Host pays 3–5% service fee
- **Total take per booking: 11–17%**

> Example: 1,000 bookings/month × avg 800 EGP booking = 800,000 EGP in GMV → **88,000–136,000 EGP/month revenue**

### 2. Featured Listing Boost

- Hosts pay 50–200 EGP to appear at top of search results
- Very low cost to implement, pure profit

### 3. Host Subscription (Pro Plan)

| Tier | Price | Features |
|---|---|---|
| Free | 0 EGP/month | Up to 2 listings |
| Pro | 149 EGP/month | Unlimited listings + analytics dashboard |
| Premium | 299 EGP/month | Priority support + featured badge + WhatsApp broadcast |

---

## PHASE 2 FEATURES + REVENUE

### ✈️ Travel Tickets Affiliations
**Cost: Near zero — pure affiliate commission**

- Partner with: Booking.com flights, Skyscanner, EgyptAir, Air Arabia
- Embed search widget inside the app
- Earn 1–4% commission per ticket sold through your affiliate link
- Trigger: user books a property → shown "Find flights to [city]"

### 🍽️ Restaurants on Platform (Monthly Subscription)
**Cost: ~2–3 weeks of backend work**

- Restaurants pay **299–799 EGP/month** to be listed
- Tourist books a property in Hurghada → sees nearby restaurants
- Revenue streams:
  - Monthly listing fee (recurring, near-zero marginal cost)
  - Table reservation commission (20–50 EGP per reservation)
  - "Near my stay" push notifications → restaurants pay for premium placement
  - Sponsored menu placement inside the app

### 🧭 Experiences (Already Built!)
**Cost: Already in your codebase — just needs marketing**

- Local guides list activities (snorkeling, desert tours, cooking classes, etc.)
- You take **15–20% commission** per booking
- Bundle with property booking ("Add an experience to your trip")
- Target: foreign tourists + domestic weekend travelers

### 🩺 Consultations (Already Built!)
**Cost: Already in your codebase — just needs marketing**

- Tourism consultants, interior designers for hosts, legal/real estate advisors
- You take **20% per session**
- Target: foreign buyers wanting to invest in Egyptian properties
- Target: new hosts wanting setup advice

---

## LOW-COST EXTRA MONETIZATION IDEAS

### Almost Zero Cost to Implement

| Method | How | Est. Monthly Revenue |
|---|---|---|
| **Travel insurance upsell** | Partner with Allianz/AXA Egypt — earn 15–25% per policy sold at checkout | 5,000–30,000 EGP |
| **Airport transfer affiliate** | Partner with Careem/InDriver — "Need a ride to your property?" at booking confirmation | 2,000–10,000 EGP |
| **Currency exchange widget** | Affiliate with Wise or a local exchange — tourists need EGP | 1,000–5,000 EGP |
| **Property photography service** | Hosts pay 300–800 EGP for professional photos — you take 20% referral fee | 3,000–15,000 EGP |
| **Guest damage protection fee** | Optional 20–50 EGP "protection fee" per booking for guests — pure margin | Scales with bookings |
| **WhatsApp Business broadcast** | Charge hosts 99–199 EGP/month to send offers to their past guests via your platform | 5,000–20,000 EGP |
| **SIM card / eSIM for tourists** | Affiliate with Vodafone/Orange Egypt — "Get Egypt SIM for your stay" | 1,000–8,000 EGP |
| **Co-host marketplace** | Connect property owners with local co-hosts — take 10% of co-host earnings | Scales with hosts |
| **Early check-in / late check-out upsell** | Guests pay 50–150 EGP — you keep a cut, host gets the rest | Scales with bookings |
| **Loyalty points program** | Guests earn points redeemable on future bookings — increases retention and repeat bookings | Indirect revenue |

---

## BREAK-EVEN ANALYSIS

| Scenario | Monthly Cost | Revenue Driver | Break-even |
|---|---|---|---|
| Conservative | 5,500 EGP | 11% booking commission only | ~62 bookings at 800 EGP avg |
| Realistic | 5,500 EGP | Commission + Pro host subscriptions | ~40 bookings + 30 Pro hosts |
| Optimistic | 5,500 EGP | All streams active | Break-even by month 3 |

### At Scale (18 months)

| Stream | Monthly Revenue Est. |
|---|---|
| 500 bookings × 11% × 800 EGP avg | 44,000 EGP |
| 100 Pro/Premium host subscriptions × 200 EGP avg | 20,000 EGP |
| 100 restaurants × 400 EGP/month listing fee | 40,000 EGP |
| Experiences (50 bookings × 15% × 500 EGP) | 3,750 EGP |
| Affiliates (flights + transfers + insurance) | 10,000–30,000 EGP |
| **Total** | **~117,750–137,750 EGP/month** |
| Minus costs | –5,500 EGP |
| **Net profit** | **~112,000–132,000 EGP/month** |

---

## KEY RISKS & MITIGATIONS

| Risk | Mitigation |
|---|---|
| Low initial supply (few hosts) | Launch in one city first (Cairo/Hurghada) — quality over quantity |
| Payment trust issues | Show escrow model — "money held until check-in confirmed" |
| Seasonality (Ramadan/winter dip) | Push experience/consultation revenue in off-season |
| Competition (Airbnb/Booking.com) | Focus on local payment methods (InstaPay/OPay), Arabic UX, Egyptian-specific properties (chalets, sahel, North Coast) |
| Host churn | Lock-in with annual subscription discounts + performance analytics |

---

## PHASE 2 ROADMAP TIMELINE

| Quarter | Focus |
|---|---|
| Q1 | Launch Phase 1 — properties + experiences + consultations live |
| Q2 | Add restaurant listings + host subscription tiers |
| Q3 | Travel ticket affiliations + insurance upsell at checkout |
| Q4 | Airport transfers + SIM affiliate + WhatsApp broadcast for hosts |
| Year 2 | Co-host marketplace + loyalty program + B2B corporate travel |

---

## BOTTOM LINE

With monthly costs under **5,500 EGP**, you need only **~50 completed bookings/month** to cover all costs.

Phase 2 restaurant listings alone — at **100 restaurants × 400 EGP/month = 40,000 EGP/month** recurring revenue — with almost no additional engineering work — makes the business profitable independent of booking volume.

The asset you are building (a trusted local marketplace with payments, reviews, and disputes) has **network effects**: every new host attracts guests, every new guest attracts hosts. That compounding is the real value.
