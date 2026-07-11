-- Migration: notifications
-- Created: 2026-07-11T15:00:00.000Z
-- Per-user notification inbox (follow, like, mention, ...).

-- migrate:up
CREATE TABLE notifications (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  actor_id     BIGINT REFERENCES users (id) ON DELETE SET NULL,
  type         TEXT NOT NULL,
  entity_id    BIGINT,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inbox listing: a recipient's notifications, newest first.
CREATE INDEX idx_notifications_recipient_created
  ON notifications (recipient_id, created_at DESC);
-- Partial index to count unread quickly.
CREATE INDEX idx_notifications_unread
  ON notifications (recipient_id) WHERE read_at IS NULL;

-- migrate:down
DROP TABLE IF EXISTS notifications;
