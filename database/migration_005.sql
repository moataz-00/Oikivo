-- Migration 005: Messaging enhancements
-- Adds message_type, image_url to messages; updated_at to conversations
-- Uses IF NOT EXISTS so it is safe to re-run on MariaDB / MySQL 8.0.3+

-- Add message type and image URL to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type ENUM('text', 'image') NOT NULL DEFAULT 'text' AFTER body,
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER message_type;

-- Add updated_at to conversations so we can sort by most-recently-active
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER created_at;

-- Back-fill updated_at from the latest message in each conversation
UPDATE conversations c
  INNER JOIN (
    SELECT conversation_id, MAX(created_at) AS latest
    FROM messages
    GROUP BY conversation_id
  ) m ON m.conversation_id = c.id
SET c.updated_at = m.latest;
