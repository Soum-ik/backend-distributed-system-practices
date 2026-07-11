-- Migration: auth_password
-- Created: 2026-07-11T18:00:00.000Z
-- Adds password_hash for register/login.

-- migrate:up
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- migrate:down
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
