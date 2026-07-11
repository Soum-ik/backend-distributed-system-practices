-- migrate:up
ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ, ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- migrate:down
ALTER TABLE users DROP COLUMN IF EXISTS last_login, DROP COLUMN IF EXISTS is_active;