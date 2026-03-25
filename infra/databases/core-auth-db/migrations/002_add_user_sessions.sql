-- Migration: add user_session table for session tracking
-- Run this on existing databases where init.sql has already been applied.

CREATE TABLE IF NOT EXISTS user_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    jti UUID UNIQUE NOT NULL,
    user_agent VARCHAR,
    ip_address VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_session_jti ON user_session(jti);
CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON user_session(user_id);
