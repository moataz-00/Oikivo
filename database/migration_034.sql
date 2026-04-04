-- ============================================================
-- Migration 034 — Performance indexes
-- Adds a composite covering index on cohosts(cohost_id, status)
-- to speed up getMyInvites / getMyProperties queries that always
-- filter by cohost_id AND status.
-- Also adds an explicit index on bookings(payment_status) for
-- the admin "pending instapay" query, and a composite index on
-- notifications(user_id, created_at) for DESC-sorted paging.
-- ============================================================

-- The FK on cohost_id already creates a single-column index;
-- this replaces it with a composite that covers the WHERE clause
-- `cohost_id = ? AND status = ?` without a second key lookup.
ALTER TABLE cohosts
  ADD INDEX idx_cohosts_cohost_status (cohost_id, status);

-- Admin "pending instapay submissions" query filters by
-- payment_status + payment_method frequently.
ALTER TABLE bookings
  ADD INDEX idx_bookings_payment (payment_status, payment_method);

-- Notifications paging: WHERE user_id = ? ORDER BY created_at DESC
-- The existing idx_notifications_read covers (user_id, is_read) but
-- not ORDER BY created_at — this composite also serves sorted paging.
ALTER TABLE notifications
  ADD INDEX idx_notifications_user_time (user_id, created_at);
