-- Migration: follows
-- Created: 2026-07-11T14:00:00.000Z
-- Directed follow graph: follower_id follows followee_id.

-- migrate:up
CREATE TABLE follows (
  follower_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  followee_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> followee_id)
);

-- "Who does X follow" and "who follows X" both need fast lookups.
CREATE INDEX idx_follows_followee ON follows (followee_id);

-- migrate:down
DROP TABLE IF EXISTS follows;
