-- Migration: users_profile_fields
-- Created: 2026-07-11T12:00:00.000Z
-- Adds social-profile fields to users for the feed (username, bio, avatar).

-- migrate:up
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS bio      TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Backfill a username from email local-part for existing rows, then enforce.
UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL;

ALTER TABLE users
  ALTER COLUMN username SET NOT NULL,
  ADD CONSTRAINT users_username_key UNIQUE (username);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- migrate:down
DROP INDEX IF EXISTS idx_users_username;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users
  DROP COLUMN IF EXISTS username,
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS avatar_url;
