-- Migration: search
-- Created: 2026-07-11T16:00:00.000Z
-- Full-text search over posts and trigram search over usernames/names.

-- migrate:up
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Post body full-text search via a generated tsvector column.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS body_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', body)) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_body_tsv ON posts USING gin (body_tsv);

-- Trigram indexes for fuzzy user lookup.
CREATE INDEX IF NOT EXISTS idx_users_username_trgm
  ON users USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm
  ON users USING gin (name gin_trgm_ops);

-- migrate:down
DROP INDEX IF EXISTS idx_users_name_trgm;
DROP INDEX IF EXISTS idx_users_username_trgm;
DROP INDEX IF EXISTS idx_posts_body_tsv;
ALTER TABLE posts DROP COLUMN IF EXISTS body_tsv;
-- Leave the pg_trgm extension in place; other objects may rely on it.
