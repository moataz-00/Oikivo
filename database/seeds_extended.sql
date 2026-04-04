-- ============================================================
-- Journey Stay — Extended Property Seed Data
-- 30+ properties in Egypt and worldwide
-- Run AFTER seeds.sql (users 2-4 must exist as hosts)
-- ============================================================

USE sakan_db;

-- ============================================================
-- PROPERTIES — EGYPT (properties 7–20)
-- ============================================================
INSERT INTO properties (
  host_id, category_id, title, description,
  space_type, property_kind, price_per_night, currency,
  cleaning_fee, max_guests, bedrooms, bathrooms, beds,
  address, city, country, country_code, latitude, longitude,
  instant_book, status, avg_rating, review_count
) VALUES

-- 7: Luxurious Penthouse — Maadi
(2, 6, 'Sky Penthouse with Panoramic Garden City Views',
 'Three floors of pure luxury perched atop a landmark Maadi tower. A private rooftop pool, cinema room, and fully equipped chef''s kitchen. This is the finest private accommodation in Cairo for discerning travelers and corporate guests.',
 'entire_place', 'apartment', 320.00, 'USD',
 100.00, 8, 4, 4.0, 6,
 'Road 9, Maadi', 'Cairo', 'Egypt', 'EG',
 29.9602, 31.2587, 0, 'published', 4.95, 17),

-- 8: Nubian Village House — Luxor
(3, 15, 'Authentic Nubian Guesthouse on the West Bank',
 'Step into living history on the West Bank of Luxor. This lovingly restored Nubian guesthouse sits minutes from the Valley of the Kings. Hand-painted walls, rooftop sunsets over the Nile, and home-cooked Egyptian breakfasts every morning.',
 'entire_place', 'house', 45.00, 'USD',
 10.00, 6, 3, 2.0, 4,
 'Al Gezira, West Bank', 'Luxor', 'Egypt', 'EG',
 25.6966, 32.6103, 1, 'published', 4.91, 63),

-- 9: Red Sea Diving Loft — Dahab
(4, 1, 'Diver''s Loft with Rooftop — Steps from Blue Hole',
 'Purpose-built for divers, this modern loft is a 3-minute walk from the legendary Dahab Blue Hole. Storage rooms for gear, freshwater rinse station, high-speed WiFi, and a rooftop hammock area with mountain views. Breakfast included.',
 'entire_place', 'apartment', 65.00, 'USD',
 15.00, 4, 2, 1.0, 3,
 'Blue Hole Road, Dahab', 'South Sinai', 'Egypt', 'EG',
 28.5756, 34.5150, 1, 'published', 4.88, 41),

-- 10: Siwa Oasis Ecolodge
(2, 13, 'Desert Ecolodge in Siwa Oasis',
 'Disconnect from the world in this eco-lodge built from traditional kershef (salt rock). Solar powered, hot spring access, dune safari at dawn. The ultimate wellness escape in one of Egypt''s most remote and mystical destinations.',
 'entire_place', 'villa', 95.00, 'USD',
 30.00, 4, 2, 1.0, 3,
 'Siwa Town Center', 'Siwa', 'Egypt', 'EG',
 29.2027, 25.5185, 0, 'published', 4.97, 29),

-- 11: Modern Flat — New Cairo
(3, 8, 'Designer Apartment near Cairo Festival City',
 'Chic and fully furnished 2-bedroom in 5th Settlement. 10 minutes from Cairo International Airport, walking distance to Cairo Festival City Mall. High-speed fiber internet, Netflix, and smart home controls.',
 'entire_place', 'apartment', 60.00, 'USD',
 20.00, 4, 2, 1.0, 2,
 '5th Settlement, Ring Road', 'New Cairo', 'Egypt', 'EG',
 30.0099, 31.4777, 1, 'published', 4.74, 52),

-- 12: Aswan Nile Houseboat
(4, 11, 'Converted Felucca Houseboat — Aswan Nile',
 'Sleep on the water in this beautifully converted traditional felucca permanently moored on the Nile. Watch Nubian fishermen at sunrise, sunset cocktails on deck, and close to Philae Temple and the Aswan High Dam.',
 'entire_place', 'house', 75.00, 'USD',
 20.00, 2, 1, 1.0, 2,
 'Corniche El Nil, Aswan', 'Aswan', 'Egypt', 'EG',
 24.0889, 32.8998, 0, 'published', 4.86, 38),

-- 13: Ain Sokhna Beach Bungalow
(2, 1, 'Beachfront Bungalow — Ain Sokhna',
 'A quick 1.5-hour drive from Cairo, this private beachfront bungalow on the Red Sea Coast is perfect for weekend escapes. Private beach access, covered terrace, outdoor shower, and fully stocked kitchen.',
 'entire_place', 'house', 110.00, 'USD',
 35.00, 6, 2, 2.0, 3,
 'Porto Sokhna Resort', 'Sokhna', 'Egypt', 'EG',
 29.6155, 32.3508, 1, 'published', 4.82, 44),

-- 14: Downtown Cairo Historic Flat
(3, 15, 'Belle Époque Apartment in Downtown Cairo',
 'A gem of Cairo''s golden age. This lovingly maintained 1920s apartment retains original parquet floors, high stucco ceilings, and French windows overlooking a leafy boulevard. Walk to Tahrir Square, the Egyptian Museum, and Opera House.',
 'entire_place', 'apartment', 42.00, 'USD',
 12.00, 3, 1, 1.0, 2,
 'Talaat Harb Square, Downtown', 'Cairo', 'Egypt', 'EG',
 30.0480, 31.2361, 1, 'published', 4.68, 71),

-- 15: Sahel North Coast Villa
(4, 1, 'White Villa on the Mediterranean — North Coast',
 'A gleaming white villa on Egypt''s turquoise Mediterranean coast. Massive private pool, beachfront access, rooftop lounge, and a games room. Sleeps 10 comfortably. Perfect for groups, families, and milestone celebrations.',
 'entire_place', 'villa', 450.00, 'USD',
 150.00, 10, 5, 4.0, 7,
 'Sidi Heneish, Matruh', 'North Coast', 'Egypt', 'EG',
 31.1965, 27.8742, 0, 'published', 4.93, 22),

-- 16: El Gouna Water Villa
(2, 3, 'Water Villa with Private Lagoon Dock — El Gouna',
 'Float between lagoon and sea in this unique water villa. Your private dock means you can kayak or paddleboard directly from home. A golf cart is included, and El Gouna''s vibrant restaurants and nightlife are minutes away.',
 'entire_place', 'villa', 280.00, 'USD',
 80.00, 6, 3, 3.0, 4,
 'Villa Zone, El Gouna', 'Red Sea', 'Egypt', 'EG',
 27.4010, 33.6843, 0, 'published', 4.96, 31),

-- ============================================================
-- PROPERTIES — WORLDWIDE (properties 17–40)
-- ============================================================

-- 17: Santorini, Greece
(3, 11, 'Whitewashed Caldera Cave House — Oia, Santorini',
 'The quintessential Santorini experience. This traditional cave house in Oia offers unobstructed caldera views and front-row seats to the world''s most famous sunset. Plunge pool, private terrace, and champagne on arrival.',
 'entire_place', 'villa', 520.00, 'EUR',
 100.00, 2, 1, 1.0, 1,
 'Oia Village', 'Oia', 'Greece', 'GR',
 36.4625, 25.3740, 0, 'published', 4.99, 88),

-- 18: Dubai Marina Apartment
(4, 6, 'Full-Floor Penthouse — Dubai Marina Skyline View',
 'An entire floor of a Marina tower, 52 floors up. 270-degree views of the Marina, Palm Jumeirah, and Arabian Gulf. Private pool, home cinema, and a chauffeur service available. The definition of Dubai luxury.',
 'entire_place', 'apartment', 850.00, 'AED',
 300.00, 6, 3, 3.5, 4,
 'Marina Walk, Dubai Marina', 'Dubai', 'United Arab Emirates', 'AE',
 25.0806, 55.1439, 0, 'published', 4.92, 45),

-- 19: Bali Ubud Villa
(2, 2, 'Jungle Rice Terrace Villa — Ubud, Bali',
 'Immerse yourself in Bali''s emerald heartland. Your private infinity pool seems to pour directly into the rice terraces below. Full staff, daily breakfast, and a private driver to Ubud''s temples and art galleries.',
 'entire_place', 'villa', 185.00, 'USD',
 50.00, 4, 2, 2.0, 2,
 'Jalan Raya Tegallalang', 'Ubud', 'Indonesia', 'ID',
 -8.4095, 115.2820, 0, 'published', 4.97, 112),

-- 20: Paris City Apartment
(3, 15, 'Haussmann Apartment — Marais District, Paris',
 'A perfectly restored Second Empire apartment in Le Marais — Paris''s most sought-after neighborhood. Exposed limestone walls, parquet floors, and a private courtyard. Walk to the Louvre, Centre Pompidou, and Picasso Museum.',
 'entire_place', 'apartment', 220.00, 'EUR',
 60.00, 4, 2, 1.0, 2,
 'Rue de Bretagne, Le Marais', 'Paris', 'France', 'FR',
 48.8620, 2.3592, 1, 'published', 4.89, 77),

-- 21: Tokyo Shinjuku Studio
(4, 8, 'Designer Capsule Studio — Shinjuku, Tokyo',
 'Experience Tokyo''s ultra-efficient design philosophy in this architect-designed micro-apartment. Smart storage, a meditation nook, and walking distance to Shinjuku Station, Golden Gai, and all the ramen you can eat.',
 'entire_place', 'apartment', 18500.00, 'JPY',
 5000.00, 2, 0, 1.0, 1,
 '3-chome, Shinjuku', 'Tokyo', 'Japan', 'JP',
 35.6938, 139.7034, 1, 'published', 4.84, 93),

-- 22: Marrakech Riad
(2, 15, 'Restored Riad with Plunge Pool — Medina, Marrakech',
 'A 16th-century merchant''s house restored to its original splendor. Zellij tilework, cedarwood ceilings, a central fountain courtyard, and a rooftop terrace overlooking the medina''s minarets. Full riad, sleeps 8.',
 'entire_place', 'house', 1800.00, 'MAD',
 400.00, 8, 4, 3.0, 6,
 'Derb Sidi Ahmed Ou Moussa, Medina', 'Marrakech', 'Morocco', 'MA',
 31.6294, -7.9880, 0, 'published', 4.94, 58),

-- 23: Maldives Overwater Bungalow
(3, 1, 'Overwater Bungalow with Glass Floor — Maldives',
 'Wake up to turquoise lagoon directly beneath you through the glass floor panels. Your own ladder into the Indian Ocean, a hammock over the water, and a butler on call 24/7. Snorkeling gear and kayaks included.',
 'entire_place', 'villa', 1200.00, 'USD',
 0.00, 2, 1, 1.0, 1,
 'North Malé Atoll', 'North Malé', 'Maldives', 'MV',
 4.3085, 73.5265, 0, 'published', 5.00, 34),

-- 24: New York City Loft
(4, 8, 'Industrial Loft in Williamsburg, Brooklyn',
 'A 19th-century factory floor transformed into a stunning open-plan loft. Exposed brick, 14-foot ceilings, and a rooftop with Manhattan skyline views. Steps from L train, vibrant restaurants, and Brooklyn''s best coffee shops.',
 'entire_place', 'apartment', 275.00, 'USD',
 75.00, 4, 1, 1.0, 1,
 'North 6th Street, Williamsburg', 'New York', 'United States', 'US',
 40.7141, -73.9590, 1, 'published', 4.87, 66),

-- 25: London Notting Hill Townhouse
(2, 15, 'Georgian Townhouse — Notting Hill, London',
 'A four-story Georgian townhouse on one of London''s most photogenic streets, two doors from Portobello Market. Original fireplaces, a private garden, and a wine cellar. Sleeps 8 in period-perfect comfort.',
 'entire_place', 'house', 650.00, 'GBP',
 150.00, 8, 4, 3.5, 5,
 'Pembridge Crescent, Notting Hill', 'London', 'United Kingdom', 'GB',
 51.5127, -0.2002, 0, 'published', 4.91, 29),

-- 26: Amalfi Coast Villa
(3, 11, 'Cliffside Lemon Grove Villa — Positano, Amalfi',
 'A romantic terraced villa clinging to the Amalfi cliffs above Positano. Private pool, lemon grove, and a boat for private coastal excursions. The view from the breakfast terrace will ruin all other breakfasts forever.',
 'entire_place', 'villa', 480.00, 'EUR',
 120.00, 6, 3, 3.0, 4,
 'Via dei Mulini, Positano', 'Positano', 'Italy', 'IT',
 40.6277, 14.4843, 0, 'published', 4.98, 42),

-- 27: Kyoto Traditional Machiya
(4, 15, 'Machiya Townhouse — Gion District, Kyoto',
 'A 100-year-old machiya (townhouse) in Kyoto''s geisha district, thoughtfully updated with underfloor heating and a Japanese soaker bath. A traditional stone garden, tatami rooms, and private tea ceremony available on request.',
 'entire_place', 'house', 42000.00, 'JPY',
 8000.00, 4, 2, 1.0, 2,
 'Gion, Higashiyama-ku', 'Kyoto', 'Japan', 'JP',
 35.0039, 135.7753, 0, 'published', 4.95, 51),

-- 28: Cape Town Sea View
(2, 11, 'Clifftop Villa with Atlantic Views — Camps Bay',
 'Perched above Camps Bay with 180-degree Atlantic Ocean views, this contemporary villa has an infinity pool that merges with the horizon. Table Mountain looms behind, Camps Bay beach is 5 minutes below.',
 'entire_place', 'villa', 380.00, 'USD',
 90.00, 8, 4, 4.0, 5,
 'The Glen, Camps Bay', 'Cape Town', 'South Africa', 'ZA',
 -33.9500, 18.3765, 0, 'published', 4.93, 38),

-- 29: Swiss Alps Chalet
(3, 10, 'Ski-in Ski-out Alpine Chalet — Verbier',
 'A classic Swiss chalet with direct piste access in the legendary Verbier ski resort. Stone fireplace, a sauna for après-ski, a wine rack stocked with Swiss Fendant, and sunset views over the Mont-Blanc massif.',
 'entire_place', 'house', 820.00, 'EUR',
 180.00, 10, 5, 4.0, 7,
 'Hameau de Verbier', 'Verbier', 'Switzerland', 'CH',
 46.0977, 7.2281, 0, 'published', 4.96, 23),

-- 30: Singapore Sky Suite
(4, 6, 'Sky Garden Suite — Marina Bay, Singapore',
 'A sky terrace apartment on the 48th floor with unobstructed views of Marina Bay Sands, the Gardens by the Bay, and the Singapore Strait. A private sky garden, lap pool, and full concierge service at your disposal.',
 'entire_place', 'apartment', 780.00, 'SGD',
 200.00, 4, 2, 2.0, 2,
 'Marina Boulevard', 'Singapore', 'Singapore', 'SG',
 1.2784, 103.8593, 0, 'published', 4.90, 27),

-- 31: Tuscany Farmhouse
(2, 2, 'Restored Farmhouse with Vineyard — Chianti, Tuscany',
 'A stone farmhouse amid rolling Chianti vineyards with your own olive grove and vineyard terrace. A heated outdoor pool, wood-fired pizza oven, and a private wine cellar. Rolling hills in every direction, total silence at night.',
 'entire_place', 'house', 340.00, 'EUR',
 80.00, 8, 4, 3.0, 5,
 'Via Chiantigiana, Greve in Chianti', 'Florence', 'Italy', 'IT',
 43.5843, 11.3178, 0, 'published', 4.97, 44),

-- 32: Bangkok Luxury Condo
(3, 6, 'Luxury High-Rise Condo — Silom, Bangkok',
 'A sleek, hotel-quality condo on the 35th floor in central Bangkok. Rooftop pool, fully equipped gym, and 24-hour concierge. BTS Sala Daeng station is literally downstairs. Perfect for business travelers and luxury seekers.',
 'entire_place', 'apartment', 4500.00, 'THB',
 1000.00, 3, 1, 1.0, 1,
 'Silom Road', 'Bangkok', 'Thailand', 'TH',
 13.7233, 100.5295, 1, 'published', 4.81, 60),

-- 33: Lisbon Heritage Apartment
(4, 15, 'Azulejo Tile Apartment — Alfama, Lisbon',
 'Perched in Alfama, Lisbon''s oldest and most atmospheric neighborhood. This apartment features original azulejo panels, a private balcony for fado evenings, and a spiral staircase to a rooftop with views to the Tagus estuary.',
 'entire_place', 'apartment', 130.00, 'EUR',
 30.00, 3, 1, 1.0, 2,
 'Rua dos Remedios, Alfama', 'Lisbon', 'Portugal', 'PT',
 38.7120, -9.1310, 1, 'published', 4.88, 73),

-- 34: Queenstown New Zealand
(2, 10, 'Lakeview Lodge — Queenstown, New Zealand',
 'A modern mountain lodge overlooking Lake Wakatipu and The Remarkables mountain range. Hot tub on the deck, a kayak launch, and minutes from Queenstown''s world-class skiing, bungee jumping, and wine trails.',
 'entire_place', 'house', 320.00, 'AUD',
 70.00, 6, 3, 2.0, 4,
 'Frankton Road', 'Queenstown', 'New Zealand', 'NZ',
 -45.0312, 168.6626, 0, 'published', 4.94, 35),

-- 35: Riyadh Modern Villa
(3, 6, 'Contemporary Villa with Pool — Al Nakheel, Riyadh',
 'A contemporary villa in one of Riyadh''s most prestigious neighborhoods. Large entertaining spaces, a private pool and garden, a cinema room, and fully equipped diwaniya. Perfect for families and delegations.',
 'entire_place', 'villa', 1500.00, 'SAR',
 400.00, 8, 4, 4.0, 5,
 'Al Nakheel District', 'Riyadh', 'Saudi Arabia', 'SA',
 24.7893, 46.6413, 0, 'published', 4.83, 19),

-- 36: Istanbul Bosphorus View
(4, 11, 'Ottoman Mansion on the Bosphorus — Bebek',
 'A genuine 19th-century waterfront mansion (yalı) in Bebek, the most prestigious address on the Bosphorus. Private boat dock, original painted ceilings, and uninterrupted views of European and Asian shores simultaneously.',
 'entire_place', 'house', 8500.00, 'TRY',
 2000.00, 6, 3, 3.0, 4,
 'Bebek Sahil', 'Istanbul', 'Turkey', 'TR',
 41.0773, 29.0462, 0, 'published', 4.96, 27),

-- 37: Petra Jordan Desert Camp
(2, 13, 'Luxury Desert Camp — Wadi Rum, Jordan',
 'Sleep under a million stars in this luxury Bedouin-style camp in Wadi Rum. Private transparent geodesic dome for stargazing from bed, gourmet Jordanian dinner, and guided jeep tours of the Mars-like landscape included.',
 'entire_place', 'villa', 150.00, 'JOD',
 30.00, 2, 1, 1.0, 1,
 'Wadi Rum Protected Area', 'Wadi Rum', 'Jordan', 'JO',
 29.5754, 35.4231, 0, 'published', 4.98, 48),

-- 38: Barcelona Gothic Quarter
(3, 15, 'Gothic Quarter Penthouse — Barcelona',
 'A stunning penthouse apartment in Barcelona''s 2,000-year-old Gothic Quarter, with a private terrace and views of the Barcelona Cathedral. Steps from Las Ramblas, the Born market, and the best tapas bars in Europe.',
 'entire_place', 'apartment', 195.00, 'EUR',
 50.00, 4, 2, 1.0, 2,
 'Carrer del Bisbe, Gòtic', 'Barcelona', 'Spain', 'ES',
 41.3831, 2.1761, 1, 'published', 4.90, 84),

-- 39: Amsterdam Canal House
(4, 15, '17th-Century Canal House — Jordaan, Amsterdam',
 'A five-story Golden Age canal house in Amsterdam''s prettiest neighborhood. The trademark steep Dutch staircase, period furniture, a canal view breakfast room, and a secret garden terrace. Bikes provided for every guest.',
 'entire_place', 'house', 285.00, 'EUR',
 65.00, 6, 3, 2.0, 4,
 'Prinsengracht, Jordaan', 'Amsterdam', 'Netherlands', 'NL',
 52.3736, 4.8811, 0, 'published', 4.92, 56),

-- 40: Zanzibar Beach Retreat
(2, 1, 'Spice Island Beach Villa — Nungwi, Zanzibar',
 'A whitewashed villa on the most beautiful beach in Zanzibar. Directly on the Indian Ocean, a private pool, coconut palms, a dhow sunset cruise included, and fresh catch grilled daily by your private cook.',
 'entire_place', 'villa', 280.00, 'USD',
 60.00, 6, 3, 3.0, 4,
 'Nungwi Beach', 'Nungwi', 'Tanzania', 'TZ',
 -5.7200, 39.2975, 0, 'published', 4.97, 39);

-- ============================================================
-- PHOTOS for new properties (using Unsplash collection URLs)
-- ============================================================
INSERT INTO property_photos (property_id, url, is_cover, sort_order) VALUES
-- Property 7 (Maadi Penthouse)
(7, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', 1, 1),
(7, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', 0, 2),
(7, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', 0, 3),
-- Property 8 (Luxor Nubian)
(8, 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200', 1, 1),
(8, 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200', 0, 2),
-- Property 9 (Dahab Diver)
(9, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', 1, 1),
(9, 'https://images.unsplash.com/photo-1682686580950-960d1d513532?w=1200', 0, 2),
-- Property 10 (Siwa Ecolodge)
(10, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200', 1, 1),
(10, 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200', 0, 2),
-- Property 11 (New Cairo Flat)
(11, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', 1, 1),
(11, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200', 0, 2),
-- Property 12 (Aswan Houseboat)
(12, 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200', 1, 1),
(12, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200', 0, 2),
-- Property 13 (Ain Sokhna)
(13, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200', 1, 1),
(13, 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1200', 0, 2),
-- Property 14 (Downtown Cairo)
(14, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200', 1, 1),
(14, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', 0, 2),
-- Property 15 (North Coast Villa)
(15, 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200', 1, 1),
(15, 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200', 0, 2),
-- Property 16 (El Gouna Water Villa)
(16, 'https://images.unsplash.com/photo-1469796466635-455ede028aca?w=1200', 1, 1),
(16, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200', 0, 2),
-- Property 17 (Santorini)
(17, 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200', 1, 1),
(17, 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200', 0, 2),
(17, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200', 0, 3),
-- Property 18 (Dubai)
(18, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200', 1, 1),
(18, 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1200', 0, 2),
-- Property 19 (Bali)
(19, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200', 1, 1),
(19, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', 0, 2),
(19, 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=1200', 0, 3),
-- Property 20 (Paris)
(20, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200', 1, 1),
(20, 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200', 0, 2),
-- Property 21 (Tokyo)
(21, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200', 1, 1),
(21, 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1200', 0, 2),
-- Property 22 (Marrakech)
(22, 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200', 1, 1),
(22, 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=1200', 0, 2),
-- Property 23 (Maldives)
(23, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200', 1, 1),
(23, 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200', 0, 2),
-- Property 24 (NYC)
(24, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200', 1, 1),
(24, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', 0, 2),
-- Property 25 (London)
(25, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200', 1, 1),
(25, 'https://images.unsplash.com/photo-1444978360867-2e716fcd17a7?w=1200', 0, 2),
-- Property 26 (Amalfi)
(26, 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1200', 1, 1),
(26, 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200', 0, 2),
-- Property 27 (Kyoto)
(27, 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200', 1, 1),
(27, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', 0, 2),
-- Property 28 (Cape Town)
(28, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200', 1, 1),
(28, 'https://images.unsplash.com/photo-1576485375217-d6a95e34d043?w=1200', 0, 2),
-- Property 29 (Swiss Alps)
(29, 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200', 1, 1),
(29, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', 0, 2),
-- Property 30 (Singapore)
(30, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200', 1, 1),
(30, 'https://images.unsplash.com/photo-1548484352-ea579e5233a8?w=1200', 0, 2),
-- Property 31 (Tuscany)
(31, 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200', 1, 1),
(31, 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200', 0, 2),
-- Property 32 (Bangkok)
(32, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200', 1, 1),
(32, 'https://images.unsplash.com/photo-1559628233-100c798642d5?w=1200', 0, 2),
-- Property 33 (Lisbon)
(33, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200', 1, 1),
(33, 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=1200', 0, 2),
-- Property 34 (Queenstown)
(34, 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200', 1, 1),
(34, 'https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=1200', 0, 2),
-- Property 35 (Riyadh)
(35, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', 1, 1),
(35, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', 0, 2),
-- Property 36 (Istanbul)
(36, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200', 1, 1),
(36, 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200', 0, 2),
-- Property 37 (Wadi Rum)
(37, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200', 1, 1),
(37, 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200', 0, 2),
-- Property 38 (Barcelona)
(38, 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200', 1, 1),
(38, 'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=1200', 0, 2),
-- Property 39 (Amsterdam)
(39, 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200', 1, 1),
(39, 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200', 0, 2),
-- Property 40 (Zanzibar)
(40, 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1200', 1, 1),
(40, 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200', 0, 2);

-- ============================================================
-- AMENITIES for new properties
-- ============================================================
-- Property 7 (Maadi Penthouse): pool, wifi, kitchen, ac, tv, gym, workspace
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(7,1),(7,2),(7,3),(7,4),(7,6),(7,8),(7,9),(7,11),(7,13),(7,21),(7,22),(7,23);
-- Property 8 (Luxor Nubian): wifi, kitchen, ac, safety
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(8,1),(8,2),(8,4),(8,21),(8,22),(8,23);
-- Property 9 (Dahab): wifi, kitchen, ac, outdoor shower, bikes
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(9,1),(9,2),(9,4),(9,18),(9,19),(9,21),(9,22);
-- Property 10 (Siwa): wifi, kitchen, pool, safety
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(10,1),(10,2),(10,11),(10,21),(10,22),(10,23);
-- Property 11 (New Cairo): wifi, kitchen, ac, tv, workspace, washing
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(11,1),(11,2),(11,4),(11,6),(11,8),(11,9),(11,21),(11,22);
-- Property 12 (Aswan Boat): wifi, kitchen, ac, safety
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(12,1),(12,2),(12,4),(12,9),(12,21),(12,22);
-- Property 13 (Sokhna): wifi, kitchen, beach access, bbq, outdoor shower
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(13,1),(13,2),(13,4),(13,14),(13,15),(13,18),(13,21),(13,22);
-- Property 14 (Downtown Cairo): wifi, kitchen, heating, tv
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(14,1),(14,2),(14,5),(14,9),(14,21),(14,22);
-- Property 15 (North Coast Villa): all
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(15,1),(15,2),(15,3),(15,4),(15,5),(15,6),(15,9),
(15,11),(15,12),(15,13),(15,14),(15,15),(15,21),(15,22),(15,23);
-- Property 16 (El Gouna): pool, wifi, kitchen, ac, bikes, lake access
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(16,1),(16,2),(16,4),(16,9),(16,11),(16,19),(16,20),(16,21),(16,22);
-- Property 17 (Santorini): wifi, pool, hot tub, kitchen, ac
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(17,1),(17,2),(17,4),(17,11),(17,12),(17,21),(17,22),(17,23);
-- Property 18 (Dubai): wifi, pool, gym, kitchen, ac, workspace
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(18,1),(18,2),(18,3),(18,4),(18,8),(18,11),(18,13),(18,21),(18,22),(18,23);
-- Property 19 (Bali): wifi, pool, kitchen, ac, outdoor shower, bbq
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(19,1),(19,2),(19,4),(19,11),(19,14),(19,18),(19,21),(19,22),(19,23);
-- Property 20 (Paris): wifi, kitchen, heating, tv, washer
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(20,1),(20,2),(20,5),(20,6),(20,9),(20,21),(20,22);
-- Property 21 (Tokyo): wifi, kitchen, ac, tv, workspace
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(21,1),(21,2),(21,4),(21,8),(21,9),(21,21),(21,22);
-- Property 22 (Marrakech): wifi, kitchen, pool, ac, bbq, hot tub
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(22,1),(22,2),(22,4),(22,11),(22,12),(22,14),(22,21),(22,22),(22,23);
-- Property 23 (Maldives): wifi, beach access, hot tub
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(23,1),(23,12),(23,15),(23,21),(23,22),(23,23);
-- Property 24 (NYC): wifi, kitchen, workspace, tv, washer
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(24,1),(24,2),(24,5),(24,6),(24,8),(24,9),(24,21),(24,22);
-- Property 25 (London): wifi, kitchen, heating, pool, gym, washer
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(25,1),(25,2),(25,3),(25,5),(25,6),(25,11),(25,13),(25,21),(25,22);
-- Property 26 (Amalfi): wifi, pool, kitchen, ac, bbq, outdoor shower
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(26,1),(26,2),(26,4),(26,11),(26,14),(26,18),(26,21),(26,22),(26,23);
-- Property 27 (Kyoto): wifi, kitchen, heating, safety
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(27,1),(27,2),(27,5),(27,21),(27,22),(27,23);
-- Property 28 (Cape Town): wifi, pool, kitchen, ac, bbq, gym
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(28,1),(28,2),(28,4),(28,11),(28,13),(28,14),(28,21),(28,22),(28,23);
-- Property 29 (Swiss Alps): wifi, kitchen, heating, hot tub, ski in/out
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(29,1),(29,2),(29,5),(29,12),(29,16),(29,21),(29,22),(29,23);
-- Property 30 (Singapore): wifi, pool, gym, kitchen, ac, workspace
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(30,1),(30,2),(30,3),(30,4),(30,8),(30,11),(30,13),(30,21),(30,22),(30,23);
-- Property 31 (Tuscany): wifi, pool, kitchen, bbq, bikes, tv
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(31,1),(31,2),(31,4),(31,9),(31,11),(31,14),(31,19),(31,21),(31,22);
-- Property 32 (Bangkok): wifi, pool, gym, kitchen, ac, workspace
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(32,1),(32,2),(32,4),(32,8),(32,11),(32,13),(32,21),(32,22),(32,23);
-- Property 33 (Lisbon): wifi, kitchen, heating, tv, workspace
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(33,1),(33,2),(33,5),(33,8),(33,9),(33,21),(33,22);
-- Property 34 (Queenstown): wifi, kitchen, hot tub, lake access, bbq, bikes
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(34,1),(34,2),(34,5),(34,12),(34,14),(34,19),(34,20),(34,21),(34,22);
-- Property 35 (Riyadh): wifi, pool, kitchen, ac, gym, tv
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(35,1),(35,2),(35,3),(35,4),(35,9),(35,11),(35,13),(35,21),(35,22),(35,23);
-- Property 36 (Istanbul): wifi, kitchen, ac, tv, workspace, bbq
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(36,1),(36,2),(36,4),(36,8),(36,9),(36,14),(36,21),(36,22);
-- Property 37 (Wadi Rum): wifi, bbq, outdoor shower, safety
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(37,1),(37,14),(37,18),(37,21),(37,22),(37,23);
-- Property 38 (Barcelona): wifi, pool, kitchen, ac, tv, workspace
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(38,1),(38,2),(38,4),(38,8),(38,9),(38,11),(38,21),(38,22),(38,23);
-- Property 39 (Amsterdam): wifi, kitchen, heating, washer, bikes, tv
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(39,1),(39,2),(39,5),(39,6),(39,9),(39,19),(39,21),(39,22);
-- Property 40 (Zanzibar): wifi, pool, kitchen, beach access, bbq, outdoor shower
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(40,1),(40,2),(40,4),(40,11),(40,14),(40,15),(40,18),(40,21),(40,22),(40,23);
