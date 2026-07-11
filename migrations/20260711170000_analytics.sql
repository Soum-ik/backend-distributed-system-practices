-- Migration: analytics
-- Created: 2026-07-11T17:00:00.000Z
-- Append-only event log to power feed analytics (impressions, clicks, etc.).

-- migrate:up
CREATE TABLE analytics_events (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT REFERENCES users (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_id  BIGINT,
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Time-window rollups scan by (event_type, created_at).
CREATE INDEX idx_analytics_type_created ON analytics_events (event_type, created_at DESC);
CREATE INDEX idx_analytics_created ON analytics_events (created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS analytics_events;
