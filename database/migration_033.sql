-- ============================================================
-- Migration 033: Co-host seed data for user 17
-- Demonstrates the co-host concept with real data.
--
-- WHERE TO FIND CO-HOSTS:
--   Co-hosts are a HOST-side feature only.
--   Navigate to: Hosting → Listings → select a listing → Co-hosts
--   URL: /hosting/listings/[uuid]/cohosts
--   They are NOT visible on the guest / trips side.
--
-- WHAT CO-HOSTS DO:
--   A property owner can delegate listing management to trusted people.
--   Two roles:
--     co_host  — full access: approve bookings, reply to guests, edit listing
--     cleaner  — turnover/cleaning notifications only
--
--   Status flow:  pending → accepted | declined
--   The invited person sees the invite under their account once they log in.
-- ============================================================

USE sakan_db;

-- ─── Helper: get up to 3 property IDs owned by user 17 ───────────────────────

DROP TEMPORARY TABLE IF EXISTS _u17_props;
CREATE TEMPORARY TABLE _u17_props AS
  SELECT id AS pid FROM properties WHERE host_id = 17 ORDER BY id LIMIT 3;

-- ─── Seed co-hosts ────────────────────────────────────────────────────────────
-- INSERT IGNORE is safe on re-runs (UNIQUE KEY on property_id + cohost_id).

-- Listing 1 → user 1 as accepted co_host (already set up and helping)
INSERT IGNORE INTO cohosts (property_id, host_id, cohost_id, role, status, created_at)
SELECT pid, 17, 1, 'co_host', 'accepted', NOW() - INTERVAL 14 DAY
FROM _u17_props LIMIT 1;

-- Listing 1 → user 2 as pending cleaner invite (sent recently)
INSERT IGNORE INTO cohosts (property_id, host_id, cohost_id, role, status, created_at)
SELECT pid, 17, 2, 'cleaner', 'pending', NOW() - INTERVAL 2 DAY
FROM _u17_props LIMIT 1;

-- Listing 2 → user 3 as pending co_host invite (if a second property exists)
INSERT IGNORE INTO cohosts (property_id, host_id, cohost_id, role, status, created_at)
SELECT pid, 17, 3, 'co_host', 'pending', NOW() - INTERVAL 1 DAY
FROM _u17_props LIMIT 1 OFFSET 1;

-- ─── Clean up ─────────────────────────────────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS _u17_props;
