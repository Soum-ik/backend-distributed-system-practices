-- Migration: posts
-- Created: 2026-07-11T13:00:00.000Z
-- Posts authored by users, plus likes. Core of the social feed.

-- migrate:up
CREATE TABLE posts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_id  BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feed queries fetch a user's posts newest-first.
CREATE INDEX idx_posts_author_created ON posts (author_id, created_at DESC);
CREATE INDEX idx_posts_created ON posts (created_at DESC);

CREATE TABLE post_likes (
  post_id    BIGINT NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- migrate:down
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS posts;
