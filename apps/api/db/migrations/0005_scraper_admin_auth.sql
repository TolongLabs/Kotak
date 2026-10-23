CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS scraper_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE CHECK (
    username = lower(btrim(username))
    AND username ~ '^[a-z0-9][a-z0-9._-]{2,63}$'
  ),
  password_hash text NOT NULL CHECK (char_length(password_hash) = 60),
  enabled boolean NOT NULL DEFAULT true,
  failed_login_attempts integer NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scraper_admin_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid NOT NULL REFERENCES scraper_admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scraper_admin_sessions_user_id_idx
  ON scraper_admin_sessions (user_id);
CREATE INDEX IF NOT EXISTS scraper_admin_sessions_expires_at_idx
  ON scraper_admin_sessions (expires_at);
