# Oikivo — 3-Month Feasibility Study (Phase 1)
### Property Rental Platform · Egypt · June–August 2026

> **Scope:** Phase 1 only — hosts list properties, guests book them. Web platform only (no mobile app in Phase 1).
> **Revenue model:** 5% service fee charged to guests only.
> **Exchange rate used throughout:** 1 USD = 50 EGP

---

## 1. Business Model Summary

| Item | Value |
|---|---|
| Platform fee | **5% of booking total** (charged to guest on top of property price) |
| Host fee | **0%** — hosts pay nothing (Phase 1 acquisition strategy) |
| Payment gateway | OPay — **2.25% of transaction + 2 EGP flat fee** per booking |
| Effective net per booking | 5% fee − (2.25% + 2 EGP) OPay cost |

**Example booking:**
```
Property price:     2,000 EGP  (2 nights × 1,000 EGP)
Guest pays:         2,100 EGP  (2,000 + 5% platform fee = 100 EGP platform fee)
OPay deducts:         49.25 EGP (2.25% × 2,100 + 2 EGP flat)
Platform net:         50.75 EGP per booking
```

---

## 2. Key Assumptions

| Assumption | Value |
|---|---|
| Average booking value (base case) | 2,500 EGP |
| Average booking value (worst case) | 1,500 EGP |
| Average stay duration | 2–3 nights |
| Platform service fee | 5% (guest only) |
| OPay processing cost | **2.25% of gross transaction + 2 EGP flat fee per booking** |
| AWS | FREE — 6-month free tier (EC2 t2.micro, RDS t3.micro, 5 GB S3) |
| Google Maps API | FREE — **90-day free trial** + $300 new-account credit + 10K free calls/SKU/month (always-on) |
| Domain | $11.25/year → paid once in Month 1 ≈ **563 EGP** |
| SSL certificate | FREE (AWS Certificate Manager) |
| Email (SES) | FREE (62K emails/month free tier) |
| Push notifications | FREE (Firebase) |
| WhatsApp sender | T7kom Plus: **100 EGP/month** Basic → **200 EGP/month** Unlimited |
| Mobile app | **None in Phase 1** — web platform only |

---

## 3. Revenue Projections — 3 Scenarios

### 3.1 Realistic / Base Case

> OPay cost per booking = (2.25% × guest_pays) + 2 EGP flat. Guest pays = booking value × 1.05.

| Month | Properties Listed | Bookings | Avg Booking | Gross GMV | 5% Fee (Revenue) | OPay Cost | **Net Revenue** |
|---|---|---|---|---|---|---|---|
| Month 1 (Jun) | 20 | 10 | 2,000 EGP | 20,000 EGP | 1,000 EGP | 493 EGP | **507 EGP** |
| Month 2 (Jul) | 50 | 35 | 2,500 EGP | 87,500 EGP | 4,375 EGP | 2,137 EGP | **2,238 EGP** |
| Month 3 (Aug) | 90 | 80 | 2,500 EGP | 200,000 EGP | 10,000 EGP | 4,885 EGP | **5,115 EGP** |
| **3-Month Total** | | **125** | | **307,500 EGP** | **15,375 EGP** | **7,515 EGP** | **7,860 EGP** |

### 3.2 Best Case

| Month | Properties Listed | Bookings | Avg Booking | Gross GMV | 5% Fee (Revenue) | OPay Cost | **Net Revenue** |
|---|---|---|---|---|---|---|---|
| Month 1 (Jun) | 40 | 25 | 2,500 EGP | 62,500 EGP | 3,125 EGP | 1,527 EGP | **1,598 EGP** |
| Month 2 (Jul) | 100 | 80 | 3,000 EGP | 240,000 EGP | 12,000 EGP | 5,830 EGP | **6,170 EGP** |
| Month 3 (Aug) | 200 | 180 | 3,000 EGP | 540,000 EGP | 27,000 EGP | 13,118 EGP | **13,882 EGP** |
| **3-Month Total** | | **285** | | **842,500 EGP** | **42,125 EGP** | **20,475 EGP** | **21,650 EGP** |

### 3.3 Worst Case ⚠️

| Month | Properties Listed | Bookings | Avg Booking | Gross GMV | 5% Fee (Revenue) | OPay Cost | **Net Revenue** |
|---|---|---|---|---|---|---|---|
| Month 1 (Jun) | 5 | 3 | 1,500 EGP | 4,500 EGP | 225 EGP | 112 EGP | **113 EGP** |
| Month 2 (Jul) | 12 | 8 | 1,500 EGP | 12,000 EGP | 600 EGP | 300 EGP | **300 EGP** |
| Month 3 (Aug) | 22 | 15 | 2,000 EGP | 30,000 EGP | 1,500 EGP | 739 EGP | **761 EGP** |
| **3-Month Total** | | **26** | | **46,500 EGP** | **2,325 EGP** | **1,151 EGP** | **1,174 EGP** |

> **Worst case trigger:** slow host adoption, no marketing budget spent, no influencer traction, summer slowdown for domestic travel.

---

## 4. Infrastructure Expenses (3 Months)

### 4.1 Recurring Monthly Infrastructure

| Service | Plan | Month 1 | Month 2 | Month 3 | Notes |
|---|---|---|---|---|---|
| AWS (EC2 + RDS + S3 + CloudFront) | Free Tier | **0 EGP** | **0 EGP** | **0 EGP** | 6-month free tier: t2.micro EC2, t3.micro RDS, 5GB S3, 15GB data out |
| Google Maps API | 90-day free trial + $300 credit | **0 EGP** | **0 EGP** | **0 EGP** | 90-day free trial covers all 3 months; 10K calls/SKU/month free forever + $300 credit as buffer |
| WhatsApp (T7kom Plus) | Basic 100 EGP/mo | **100 EGP** | **100 EGP** | **200 EGP** | Upgrade to Unlimited (200 EGP) in Month 3 as messages grow |
| Email (AWS SES) | Free tier | **0 EGP** | **0 EGP** | **0 EGP** | 62K emails/month free |
| Push Notifications | Firebase Spark | **0 EGP** | **0 EGP** | **0 EGP** | Free for startup volume |
| SSL Certificate | AWS ACM | **0 EGP** | **0 EGP** | **0 EGP** | Free |
| **Monthly Infrastructure Total** | | **100 EGP** | **100 EGP** | **200 EGP** | |

### 4.2 One-Time Infrastructure Costs (Paid in Month 1)

| Item | Cost (USD) | Cost (EGP) | Notes |
|---|---|---|---|
| Domain (1 year) | $11.25 | **563 EGP** | Paid once in Month 1 |
| **One-Time Total** | **$11.25** | **563 EGP** | No mobile app in Phase 1 — no app store fees |

### 4.3 Google Maps — WORST CASE Scenario ⚠️

If user base grows aggressively and Places Autocomplete usage spikes beyond free tiers:

| API | Free Tier | Price Beyond Free | Worst Case Overage (Month 3) |
|---|---|---|---|
| Maps JS / Mobile SDK | Unlimited (Essentials) | — | 0 EGP |
| Geocoding API | 10K requests/month | $5 per 1K requests | ~250 EGP (50K total requests) |
| Places Autocomplete | 10K requests/month | $17 per 1K requests | ~1,700 EGP (100K total requests) |
| Directions API | 10K requests/month | $5 per 1K requests | ~250 EGP (50K total requests) |
| **Worst case total Maps cost** | | | **~2,200 EGP/month** |

> **Reality check:** Google Maps gives a **90-day free trial** (covers all 3 months of Phase 1) plus a **$300 new-account credit** (~15,000 EGP worth) that carries over after the trial. At startup traffic (< 200 daily active users), you will almost certainly stay within the always-on free tier for all 3 months. Worst case Maps costs only materialize with 50K+ API calls/month — which means you're already winning.

### 4.4 AWS After Free Tier (Month 7+, for planning ahead)

| Service | Estimated Monthly Cost |
|---|---|
| EC2 t3.small | ~$15/month = 750 EGP |
| RDS t3.micro | ~$15/month = 750 EGP |
| S3 + CloudFront | ~$5–10/month = 250–500 EGP |
| **Total post-free-tier** | **~1,750–2,000 EGP/month** |

---

## 5. Marketing Expenses (3 Months)

### 5.1 Monthly Marketing Budget

> Content creation (Reels, photos, copy) is done by you — zero cost.
> **No paid advertising in Phase 1** — 100% organic growth (Facebook Groups, Instagram Reels, WhatsApp, direct host outreach).

| Channel | Month 1 | Month 2 | Month 3 | 3-Month Total |
|---|---|---|---|
| **Organic only (no paid ads)** | **0 EGP** | **0 EGP** | **0 EGP** | **0 EGP** |
| **Monthly Marketing Total** | **0 EGP** | **0 EGP** | **0 EGP** | **0 EGP** |

> No marketing costs — content and creatives are self-produced, distribution is fully organic.

---

## 6. Total Burn Rate — Month by Month

### 6.1 Full Cost Summary

| Cost Category | Month 1 | Month 2 | Month 3 | 3-Month Total |
|---|---|---|---|---|
| Infrastructure (recurring) | 100 EGP | 100 EGP | 200 EGP | 400 EGP |
| Infrastructure (one-time, Month 1 only) | 563 EGP | 0 EGP | 0 EGP | 563 EGP |
| Marketing (organic — no paid ads) | 0 EGP | 0 EGP | 0 EGP | 0 EGP |
| **Total Monthly Burn** | **663 EGP** | **100 EGP** | **200 EGP** | **963 EGP** |

### 6.2 Net P&L — Base Case

| | Month 1 | Month 2 | Month 3 | 3-Month Total |
|---|---|---|---|---|
| Net Revenue | 507 EGP | 2,238 EGP | 5,115 EGP | 7,860 EGP |
| Total Expenses | 663 EGP | 100 EGP | 200 EGP | 963 EGP |
| **Net P&L** | **−156 EGP** | **+2,138 EGP** | **+4,915 EGP** | **+6,897 EGP** |

### 6.3 Net P&L — Best Case

| | Month 1 | Month 2 | Month 3 | 3-Month Total |
|---|---|---|---|---|
| Net Revenue | 1,598 EGP | 6,170 EGP | 13,882 EGP | 21,650 EGP |
| Total Expenses | 663 EGP | 100 EGP | 200 EGP | 963 EGP |
| **Net P&L** | **+935 EGP** | **+6,070 EGP** | **+13,682 EGP** | **+20,687 EGP** |

### 6.4 Net P&L — Worst Case ⚠️

| | Month 1 | Month 2 | Month 3 | 3-Month Total |
|---|---|---|---|---|
| Net Revenue | 113 EGP | 300 EGP | 761 EGP | 1,174 EGP |
| Total Expenses | 663 EGP | 100 EGP | 200 EGP | 963 EGP |
| **Net P&L** | **−550 EGP** | **+200 EGP** | **+561 EGP** | **+211 EGP** |

> **Takeaway:** With zero paid ads, the burn rate is ultra-low (663 / 100 / 200 EGP per month). **Every scenario is profitable by Month 2** — even worst case only loses 550 EGP in Month 1 and ends 3 months at +211 EGP. Base case generates +6,897 EGP over 3 months on pure organic. Growth will be slower without paid acquisition, but financial risk is minimal.

---

## 7. Break-Even Analysis

> Net per booking at 2,500 EGP avg = 5% fee (125 EGP) − OPay (61.06 EGP) = **~63.94 EGP net per booking**

| Scenario | Bookings Needed to Break Even |
|---|---|
| Month 1 (663 EGP — domain + WhatsApp) | **11 bookings** |
| Month 2 (100 EGP — WhatsApp Basic) | **2 bookings/month** |
| Month 3 (200 EGP — WhatsApp Unlimited) | **4 bookings/month** |
| **Organic-only mode is near break-even from Day 1** | **No paid channel dependency** |

---

## 8. Marketing Strategy — Top-of-Mind in 3 Months

> **Content (Reels, photos, copy, stories) is produced by you — zero cost.**
> Growth is 100% organic — Facebook Groups, Instagram Reels, WhatsApp, and direct host/guest outreach. No paid ads.

### Month 1 — "List Your Property, Earn Now" (Host Supply Focus)

**Goal:** Get 20+ active property listings. No supply = no marketplace.

| Action | Budget | Execution |
|---|---|---|
| **Facebook Groups (organic)** | FREE | Post daily in: شاليهات للإيجار, العقارات المصرية, تسهيل العقارات, مجموعات السياحة والسفر |
| **Reels (self-made, 2/week)** | FREE | Show a host listing a property in under 5 minutes. Show dashboard earnings counter. |
| **Direct DM outreach** | FREE | Find property owners on Instagram, Property Finder, OLX — message them directly with your pitch. |
| **WhatsApp (T7kom Basic)** | 100 EGP/mo | Host welcome sequence on registration. Booking confirmation & reminder flows. |

**KPI:** Number of active published listings.

---

### Month 2 — "Find Your Perfect Stay" (Guest Demand Focus)

**Goal:** Drive first bookings, build social proof loop.

| Action | Budget | Execution |
|---|---|---|
| **Instagram & Facebook (organic daily)** | FREE | Property showcase posts, stories, Reels — shoot and edit yourself. |
| **Travel Facebook Groups (guest focus)** | FREE | Post listings in: شاليهات للإيجار, سياحة مصر, رحلات وسفر, expat groups in Cairo / Alex. |
| **Direct guest outreach** | FREE | DM users in travel groups asking about accommodation — reply with direct property links. |
| **WhatsApp (T7kom Basic)** | 100 EGP/mo | Booking confirmation, reminders, and guest follow-up flows. |

**KPI:** Completed bookings count + first 10 guest reviews.

---

### Month 3 — "Scale What Works" (Double Down on Winners)

**Goal:** Oikivo = the default answer whenever an Egyptian thinks "vacation rental."

| Action | Budget | Execution |
|---|---|---|
| **Self-made social proof content** | FREE | Real guest testimonials (video), before/after host earnings reveals. Arabic-first. |
| **SEO & Google My Business** | FREE | Optimize listing pages for Arabic search terms. Update GMB with new photos and reviews. |
| **WhatsApp blast (T7kom Unlimited)** | 200 EGP/mo | Summer / Eid special offers to past guests. Re-engagement campaigns. |

**KPI:** Week-over-week booking growth rate ≥ 20%. First 50 completed bookings total.

---

### Always-On Free Channels (All 3 Months, Zero Cost)

| Channel | What to Do |
|---|---|
| **Facebook Groups** | Daily posts in: شاليهات, إيجار شقق, travel Egypt, expat groups in Cairo / Alex / Hurghada |
| **Instagram @oikivo** | 1 property post/day + 2 Reels/week + Stories daily (polls, countdowns, "new listing" stickers) |
| **App Store Optimization (ASO)** | Not applicable in Phase 1 (web-only) |
| **Google My Business** | Create listing and keep it updated — free local SEO signal |
| **LinkedIn** | Target property investors, hospitality entrepreneurs. Post host success stories. |
| **SEO Blog** | Articles: "أفضل شاليهات في الساحل 2026", "كيف تأجر شقتك في الزمالك وتكسب أكثر" |
| **WhatsApp Personal** | You + team members post property listings on WhatsApp Status daily |

---

## 9. What to Do in the Worst Case Scenario

If Month 2 ends with fewer than 10 total bookings:

1. **Intensify organic outreach** — post in more Facebook Groups, increase Reels cadence to daily, DM property owners on Instagram / Property Finder / OLX directly
2. **Launch "Founding Host" promo** — 0% commission for any host who lists in the first 60 days, make it loud
3. **Partner directly with 3–5 guesthouses or furnished-apartment owners** — negotiate a listing deal, give them guaranteed first bookings from your own network
4. **Run a referral contest** — "أول host يجيب 5 حجوزات يكسب 500 جنيه cash"
5. **Manual guest outreach via DM** — find travelers asking for accommodation in Egyptian travel groups and send them listing links
6. **Stay on T7kom Basic (100 EGP/month)** — skip the Unlimited upgrade until booking volume justifies it

---

## 10. Cost Reduction Levers (Emergency Mode)

| Lever | Monthly Saving | Trade-off |
|---|---|---|
| Stay on T7kom Basic instead of Unlimited | −100 EGP/month | Cap at 4,500 WhatsApp messages/month |
| Skip WhatsApp entirely (manual follow-up) | −100 EGP/month | No automated flows |
| **Survival mode (minimum viable burn)** | **~147 EGP/month** | WhatsApp Basic 100 + domain amortized 47 |

---

## 11. Required Capital Summary

### Full Budget

| Category | Amount |
|---|---|
| Infrastructure — one-time (domain only) | 563 EGP |
| Infrastructure — 3-month recurring (WhatsApp) | 400 EGP |
| Marketing — organic only (no paid ads) | 0 EGP |
| **Total 3-Month Investment** | **963 EGP (~$19 USD)** |

### Minimum Budget (Stay on WhatsApp Basic all 3 months)

| Category | Amount |
|---|---|
| Domain | 563 EGP |
| WhatsApp T7kom Basic × 3 months | 300 EGP |
| **Total 3-Month Minimum** | **863 EGP (~$17 USD)** |

---

## 12. Month-by-Month Timeline

```
Month 1 — June 2026  [Budget: 663 EGP]
├── Launch web platform publicly (no mobile app)
├── Onboard first 20 hosts via personal outreach + Facebook Groups + direct DMs (Instagram, OLX, Property Finder)
├── Pay domain: $11.25 one-time (~563 EGP)
├── T7kom Plus Basic — WhatsApp OTP + booking confirmation flows — 100 EGP
├── Self-made content daily: Facebook Groups, Instagram Reels, WhatsApp Status
└── Target: 10 bookings, 20 active listings, first 5 reviews

Month 2 — July 2026  [Budget: 100 EGP]
├── Scale to 50 active host listings
├── Organic guest acquisition: Instagram Reels, travel Facebook Groups, WhatsApp Status daily
├── T7kom Plus Basic — 100 EGP
├── Self-made Reels and Stories daily
└── Target: 35 bookings, 50 listings, 20+ reviews

Month 3 — August 2026  [Budget: 200 EGP]
├── Scale to 90+ listings
├── Publish social proof content: real guest testimonials (video), host earnings reveals
├── Upgrade T7kom to Unlimited (200 EGP) for guest re-engagement blasts
├── SEO: optimize listing pages for Arabic search terms, update Google My Business
└── Target: 80 bookings, 90 listings, 50+ reviews
```

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Slow host adoption (supply problem) | Medium | High | Zero-commission promo + personal outreach + direct partnerships |
| OPay payment failures at checkout | Low–Medium | High | Thorough end-to-end payment testing before launch |
| Google Maps API overage costs | Low | Medium | Monitor Google Cloud Console weekly; set billing alerts |
| AWS free tier expiration (Month 7) | Certain | Medium | Budget 1,750–2,000 EGP/month from Month 7 onward |
| Slow organic growth without paid ads | Medium | Medium | Intensify direct DM outreach; post in more Facebook Groups; increase Reels cadence |
| Summer hotel price cuts (competition) | Medium | Medium | Differentiate on space, privacy, kitchen — not just price |
| New platform trust deficit (Month 1) | High | High | Host/guest verification, fast WhatsApp support, visible reviews ASAP |
| No mobile app limiting reach | Medium | Medium | Ensure web is fully mobile-responsive and fast on 4G |

---

*Last updated: May 2026 · Phase 1 Scope — Web Platform, Property Hosting Only*

