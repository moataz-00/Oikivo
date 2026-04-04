-- ============================================================
-- Sakan (Ø³ÙƒÙ†) â€” Seed Data
-- Run AFTER schema.sql
-- ============================================================

USE sakan_db;

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (name, name_ar, icon, description, sort_order) VALUES
('Beachfront',      'Ø¹Ù„Ù‰ Ø§Ù„Ø´Ø§Ø·Ø¦',       'ðŸ–ï¸',  'Properties right on the water',         1),
('Countryside',     'Ø§Ù„Ø±ÙŠÙ',             'ðŸŒ¾',  'Rural and country escapes',              2),
('Amazing pools',   'Ù…Ø³Ø§Ø¨Ø­ Ø±Ø§Ø¦Ø¹Ø©',       'ðŸŠ',  'Properties with standout pools',         3),
('Cabins',          'ÙƒØ§Ø¨Ù†',              'ðŸªµ',  'Cozy cabin getaways',                    4),
('Tiny homes',      'Ù…Ù†Ø§Ø²Ù„ ØµØºÙŠØ±Ø©',       'ðŸ ',  'Compact and charming tiny homes',        5),
('Luxe',            'ÙØ§Ø®Ø±',              'ðŸ’Ž',  'Extraordinary luxury properties',         6),
('Icons',           'Ø£ÙŠÙ‚ÙˆÙ†Ø§Øª',           'ðŸ—ºï¸',  'World-famous, one-of-a-kind properties', 7),
('Rooms',           'ØºØ±Ù',              'ðŸ›ï¸',  'Private rooms in shared homes',           8),
('Mansions',        'Ù‚ØµÙˆØ±',              'ðŸ°',  'Grand and spacious mansions',             9),
('Top of the world','Ù‚Ù…Ø© Ø§Ù„Ø¹Ø§Ù„Ù…',        'â›°ï¸',  'Stunning mountaintop properties',        10),
('Amazing views',   'Ø¥Ø·Ù„Ø§Ù„Ø§Øª Ø±Ø§Ø¦Ø¹Ø©',    'ðŸŒ„',  'Properties with breathtaking views',    11),
('Camping',         'ØªØ®ÙŠÙŠÙ…',             'â›º',  'Camping and outdoor experiences',        12),
('Desert',          'Ø§Ù„ØµØ­Ø±Ø§Ø¡',          'ðŸŒµ',  'Desert and arid landscape stays',       13),
('Tropical',        'Ø§Ø³ØªÙˆØ§Ø¦ÙŠ',          'ðŸŒ´',  'Tropical and lush paradise',            14),
('Historical',      'ØªØ§Ø±ÙŠØ®ÙŠ',           'ðŸ›ï¸',  'Properties steeped in history',         15);

-- ============================================================
-- AMENITIES
-- ============================================================
-- Essential
INSERT INTO amenities (name, name_ar, icon, category, sort_order) VALUES
('WiFi',                    'ÙˆØ§ÙŠ ÙØ§ÙŠ',              'wifi',              'essential', 1),
('Kitchen',                 'Ù…Ø·Ø¨Ø®',                 'cooking-pot',       'essential', 2),
('Free parking',            'Ù…ÙˆÙ‚Ù Ù…Ø¬Ø§Ù†ÙŠ',           'square-parking',    'essential', 3),
('Air conditioning',        'ØªÙƒÙŠÙŠÙ',                'air-vent',          'essential', 4),
('Heating',                 'ØªØ¯ÙØ¦Ø©',                'flame',             'essential', 5),
('Washing machine',         'ØºØ³Ø§Ù„Ø©',                'washing-machine',   'essential', 6),
('Dryer',                   'Ù…Ø¬ÙÙ Ù…Ù„Ø§Ø¨Ø³',           'wind',              'essential', 7),
('Dedicated workspace',     'Ù…Ø³Ø§Ø­Ø© Ø¹Ù…Ù„',            'briefcase',         'essential', 8),
('TV',                      'ØªÙ„ÙØ²ÙŠÙˆÙ†',              'tv',                'essential', 9),
('Hair dryer',              'Ù…Ø¬ÙÙ Ø´Ø¹Ø±',             'zap',               'essential', 10);

-- Standout
INSERT INTO amenities (name, name_ar, icon, category, sort_order) VALUES
('Pool',                    'Ø­Ù…Ø§Ù… Ø³Ø¨Ø§Ø­Ø©',           'waves',             'standout', 1),
('Hot tub',                 'Ø­ÙˆØ¶ Ø§Ø³ØªØ­Ù…Ø§Ù… Ø³Ø§Ø®Ù†',     'thermometer',       'standout', 2),
('Gym',                     'ØµØ§Ù„Ø© Ø±ÙŠØ§Ø¶ÙŠØ©',          'dumbbell',          'standout', 3),
('BBQ grill',               'Ø´ÙˆØ§ÙŠØ©',                'flame',             'standout', 4),
('Beach access',            'ÙˆØµÙˆÙ„ Ù„Ù„Ø´Ø§Ø·Ø¦',          'anchor',            'standout', 5),
('Ski-in/ski-out',          'ØªØ²Ù„Ø¬',                 'mountain',          'standout', 6),
('Piano',                   'Ø¨ÙŠØ§Ù†Ùˆ',                'music',             'standout', 7),
('Outdoor shower',          'Ø¯Ø´ Ø®Ø§Ø±Ø¬ÙŠ',             'shower-head',       'standout', 8),
('Bikes',                   'Ø¯Ø±Ø§Ø¬Ø§Øª Ù‡ÙˆØ§Ø¦ÙŠØ©',        'bike',              'standout', 9),
('Lake access',             'ÙˆØµÙˆÙ„ Ù„Ù„Ø¨Ø­ÙŠØ±Ø©',         'sailboat',          'standout', 10);

-- Safety
INSERT INTO amenities (name, name_ar, icon, category, sort_order) VALUES
('Smoke alarm',             'ÙƒØ§Ø´Ù Ø¯Ø®Ø§Ù†',            'bell-ring',         'safety', 1),
('Carbon monoxide alarm',   'ÙƒØ§Ø´Ù Ø£ÙˆÙ„ Ø£ÙƒØ³ÙŠØ¯ Ø§Ù„ÙƒØ±Ø¨ÙˆÙ†','alert-triangle',   'safety', 2),
('Fire extinguisher',       'Ø·ÙØ§ÙŠØ© Ø­Ø±ÙŠÙ‚',           'fire-extinguisher', 'safety', 3),
('First aid kit',           'Ø¥Ø³Ø¹Ø§ÙØ§Øª Ø£ÙˆÙ„ÙŠØ©',        'cross',             'safety', 4),
('Security cameras',        'ÙƒØ§Ù…ÙŠØ±Ø§Øª Ø£Ù…Ø§Ù†',         'camera',            'safety', 5),
('Deadbolt lock',           'Ù‚ÙÙ„ Ø¢Ù…Ù†',              'lock',              'safety', 6);

-- ============================================================
-- SAMPLE USERS (passwords = "password123" bcrypt hashed)
-- ============================================================
INSERT INTO users (email, password_hash, first_name, last_name, bio, is_host, is_admin, is_email_verified, preferred_language) VALUES
-- Admin (password = "password123")
('admin@sakan.app',
 '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6',
 'Admin', 'Sakan',
 'Platform administrator',
 1, 1, 1, 'en'),

-- Hosts
('ahmed.host@example.com',
 '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6',
 'Ahmed', 'Hassan',
 'Passionate host based in Cairo. Love showing guests the best of Egypt!',
 1, 1, 'ar'),

('sara.host@example.com',
 '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6',
 'Sara', 'Mohamed',
 'Superhost with 5 years of experience. I love meeting travelers!',
 1, 1, 'en'),

('omar.host@example.com',
 '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6',
 'Omar', 'Khalil',
 'Professional property manager in Hurghada and Sharm El Sheikh.',
 1, 1, 'ar'),

-- Guests
('guest1@example.com',
 '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6',
 'Layla', 'Ibrahim',
 'Love exploring new places!',
 0, 1, 'ar'),

('guest2@example.com',
 '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6',
 'James', 'Wilson',
 'Digital nomad always looking for cozy workspaces.',
 0, 1, 'en');

-- ============================================================
-- SAMPLE PROPERTIES
-- ============================================================
INSERT INTO properties (
  host_id, category_id, title, description,
  space_type, property_kind, price_per_night, currency,
  cleaning_fee, max_guests, bedrooms, bathrooms, beds,
  address, city, country, country_code, latitude, longitude,
  instant_book, status, avg_rating, review_count
) VALUES
-- Property 1: Cairo Nile View
(2, 11, 'Stunning Nile View Apartment in Cairo',
 'Wake up to breathtaking views of the Nile from this modern, fully-equipped apartment in the heart of Cairo. Minutes from the Egyptian Museum and Khan El Khalili bazaar. Perfect for couples or solo travelers seeking a luxurious yet authentic Cairo experience.',
 'entire_place', 'apartment', 85.00, 'USD',
 25.00, 4, 2, 1.0, 2,
 'Corniche El Nil, Garden City', 'Cairo', 'Egypt', 'EG',
 30.0444, 31.2357, 1, 'published', 4.85, 42),

-- Property 2: Hurghada Beach Villa
(2, 1, 'Beachfront Villa in Hurghada with Private Pool',
 'Escape to paradise in this stunning beachfront villa. Step directly onto the white sandy beach, cool off in your private pool, and enjoy spectacular Red Sea sunsets. Fully staffed with a chef and housekeeping available on request.',
 'entire_place', 'villa', 250.00, 'USD',
 80.00, 8, 4, 3.0, 5,
 'Sahl Hasheesh Bay', 'Hurghada', 'Egypt', 'EG',
 27.1783, 33.8897, 0, 'published', 4.97, 28),

-- Property 3: Alexandria Historic Residence
(3, 15, 'Charming Historic Apartment â€” Art Deco Alexandria',
 'A beautifully restored Art Deco apartment in the most iconic neighborhood of Alexandria. Original 1940s features blend seamlessly with modern comforts. Walk to the Corniche, Alexandria Library, and the best seafood restaurants in Egypt.',
 'entire_place', 'apartment', 55.00, 'USD',
 15.00, 3, 1, 1.0, 2,
 'Stanley Beach Road, Roushdy', 'Alexandria', 'Egypt', 'EG',
 31.2156, 29.9553, 1, 'published', 4.72, 19),

-- Property 4: Sharm Desert Retreat
(4, 13, 'Luxury Desert Retreat near Sharm El Sheikh',
 'Experience the magic of the Sinai desert in this unique eco-lodge. Stargazing nights, Bedouin-style dÃ©cor, and access to world-class diving and snorkeling just 20 minutes away. Includes breakfast and sunset camel ride.',
 'entire_place', 'villa', 120.00, 'USD',
 40.00, 6, 3, 2.0, 4,
 'Ras Um Sid, Sharm El Sheikh', 'South Sinai', 'Egypt', 'EG',
 27.8623, 34.3092, 0, 'published', 4.90, 55),

-- Property 5: Cairo Cozy Studio
(3, 8, 'Cozy Studio in Zamalek â€” Cairo Island',
 'Perfect for solo travelers or couples, this cozy studio is located on Zamalek island â€” the most sophisticated and walkable neighborhood in Cairo. Surrounded by galleries, cafes, and the famous Cairo Opera House.',
 'entire_place', 'apartment', 38.00, 'USD',
 12.00, 2, 0, 1.0, 1,
 'Hassan Sabry Street, Zamalek', 'Cairo', 'Egypt', 'EG',
 30.0626, 31.2191, 1, 'published', 4.60, 87),

-- Property 6: Gouna Lagoon House
(4, 3, 'Lagoon House with Private Pool â€” El Gouna',
 'Live the El Gouna dream in this stylish lagoon house with your very own pool. The ultimate Red Sea lifestyle â€” kayaking from your doorstep, world-class golf courses, and Mediterranean-quality dining all within a golf-cart ride.',
 'entire_place', 'house', 175.00, 'USD',
 55.00, 6, 3, 2.5, 4,
 'Abu Tig Marina, El Gouna', 'Red Sea', 'Egypt', 'EG',
 27.3952, 33.6785, 1, 'published', 4.88, 33);

-- ============================================================
-- ASSIGN AMENITIES TO PROPERTIES
-- ============================================================
-- Property 1 (Cairo Nile View): WiFi, Kitchen, AC, TV, Workspace
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(1,1),(1,2),(1,4),(1,9),(1,8),(1,23),(1,24);

-- Property 2 (Hurghada Villa): All amenities
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,9),
(2,11),(2,12),(2,13),(2,14),(2,15),
(2,21),(2,22),(2,23),(2,24),(2,25),(2,26);

-- Property 3 (Alexandria Historic): WiFi, Kitchen, Heating, Washing machine
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(3,1),(3,2),(3,5),(3,6),(3,9),(3,21),(3,22);

-- Property 4 (Sharm Desert): WiFi, AC, Pool, BBQ
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(4,1),(4,4),(4,11),(4,14),(4,21),(4,22),(4,23);

-- Property 5 (Cairo Studio): WiFi, Kitchen, AC, TV
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(5,1),(5,2),(5,4),(5,9),(5,21),(5,22);

-- Property 6 (Gouna Lagoon): WiFi, Kitchen, Pool, AC, BBQ, Bikes
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(6,1),(6,2),(6,3),(6,4),(6,6),(6,9),
(6,11),(6,13),(6,14),(6,19),
(6,21),(6,22),(6,24);

-- ============================================================
-- SAMPLE PHOTOS for properties (Unsplash static URLs)
-- ============================================================
INSERT INTO property_photos (property_id, url, caption, display_order, is_cover) VALUES
-- Property 1: Nile View
(1, '/uploads/samples/cairo-nile-1.jpg',  'Nile River view from balcony', 1, 1),
(1, '/uploads/samples/cairo-nile-2.jpg',  'Open plan living area',        2, 0),
(1, '/uploads/samples/cairo-nile-3.jpg',  'Modern kitchen',               3, 0),
(1, '/uploads/samples/cairo-nile-4.jpg',  'Master bedroom',               4, 0),
(1, '/uploads/samples/cairo-nile-5.jpg',  'City skyline at dusk',         5, 0),

-- Property 2: Hurghada Villa
(2, '/uploads/samples/hurghada-1.jpg', 'Private pool facing the Red Sea', 1, 1),
(2, '/uploads/samples/hurghada-2.jpg', 'Master suite with sea view',      2, 0),
(2, '/uploads/samples/hurghada-3.jpg', 'Open kitchen and dining',         3, 0),
(2, '/uploads/samples/hurghada-4.jpg', 'Beach just steps away',           4, 0),
(2, '/uploads/samples/hurghada-5.jpg', 'Outdoor living area at sunset',   5, 0),

-- Property 3: Alexandria
(3, '/uploads/samples/alex-1.jpg', 'Art Deco faÃ§ade',            1, 1),
(3, '/uploads/samples/alex-2.jpg', 'Elegant living room',        2, 0),
(3, '/uploads/samples/alex-3.jpg', 'Original parquet floors',    3, 0),
(3, '/uploads/samples/alex-4.jpg', 'Sea view from balcony',      4, 0),

-- Property 4: Sharm Desert
(4, '/uploads/samples/sinai-1.jpg', 'Desert sunset view',      1, 1),
(4, '/uploads/samples/sinai-2.jpg', 'Bedouin-style bedroom',   2, 0),
(4, '/uploads/samples/sinai-3.jpg', 'Outdoor stargazing area', 3, 0),
(4, '/uploads/samples/sinai-4.jpg', 'Desert infinity pool',    4, 0),
(4, '/uploads/samples/sinai-5.jpg', 'Camel ride at sunrise',   5, 0),

-- Property 5: Cairo Studio
(5, '/uploads/samples/zamalek-1.jpg', 'Bright studio with Nile glimpse', 1, 1),
(5, '/uploads/samples/zamalek-2.jpg', 'Fully equipped kitchen corner',   2, 0),
(5, '/uploads/samples/zamalek-3.jpg', 'Comfortable queen bed',           3, 0),

-- Property 6: Gouna
(6, '/uploads/samples/gouna-1.jpg', 'Lagoon House exterior at dusk', 1, 1),
(6, '/uploads/samples/gouna-2.jpg', 'Private pool with lagoon views', 2, 0),
(6, '/uploads/samples/gouna-3.jpg', 'Open living and dining area',    3, 0),
(6, '/uploads/samples/gouna-4.jpg', 'Master bedroom balcony',         4, 0),
(6, '/uploads/samples/gouna-5.jpg', 'Kayaking on the lagoon',         5, 0);

-- ============================================================
-- SAMPLE REVIEWS
-- ============================================================
-- Booking first (guest 5 at property 1)
INSERT INTO bookings (property_id, guest_id, host_id, check_in, check_out, guests_count, nights, base_amount, cleaning_fee, service_fee, taxes, total_amount, currency, status, payment_status)
VALUES (1, 5, 2, '2025-12-10', '2025-12-15', 2, 5, 425.00, 25.00, 63.00, 40.00, 553.00, 'USD', 'completed', 'paid');

INSERT INTO bookings (property_id, guest_id, host_id, check_in, check_out, guests_count, nights, base_amount, cleaning_fee, service_fee, taxes, total_amount, currency, status, payment_status)
VALUES (2, 6, 2, '2025-11-20', '2025-11-27', 4, 7, 1750.00, 80.00, 259.00, 150.00, 2239.00, 'USD', 'completed', 'paid');

INSERT INTO reviews (booking_id, reviewer_id, property_id, overall_rating, cleanliness_rating, accuracy_rating, communication_rating, location_rating, value_rating, checkin_rating, comment, host_reply)
VALUES (1, 5, 1, 5, 5, 5, 5, 5, 4, 5,
 'Absolutely incredible views! Ahmed was a wonderful host â€” very responsive and helpful. The apartment was spotless and had everything we needed. One of the best stays we''ve ever had!',
 'Thank you so much Layla! It was a pleasure hosting you. Hope to see you again soon! ðŸŒŸ');

INSERT INTO reviews (booking_id, reviewer_id, property_id, overall_rating, cleanliness_rating, accuracy_rating, communication_rating, location_rating, value_rating, checkin_rating, comment)
VALUES (2, 6, 2, 5, 5, 5, 5, 5, 5, 5,
 'This villa exceeded every expectation. The private pool, the beach access, the staff â€” all perfect. Cannot recommend enough. We will be back!');
