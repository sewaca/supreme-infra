-- Migration: add auth_challenge table for 2FA challenge flow

CREATE TABLE IF NOT EXISTS auth_challenge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expiring_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_auth_challenge_user_id ON auth_challenge(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_challenge_expiring_at ON auth_challenge(expiring_at);
