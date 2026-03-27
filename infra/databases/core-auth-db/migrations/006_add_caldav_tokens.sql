-- Migration: add caldav_token table for CalDAV calendar subscription tokens

CREATE TABLE IF NOT EXISTS caldav_token (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(64) UNIQUE NOT NULL,
    user_id     UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL DEFAULT 'CalDav calendar',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_caldav_token_lookup ON caldav_token(token) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_caldav_token_user   ON caldav_token(user_id);
