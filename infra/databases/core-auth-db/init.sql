-- Initial schema for core-auth database
-- This script is executed automatically when PostgreSQL starts for the first time

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS auth_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_user_email ON auth_user(email);

-- 2FA table — reserved for future two-factor authentication support
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    method VARCHAR(20) DEFAULT 'totp',   -- totp / sms / email
    secret VARCHAR,                       -- TOTP secret (e.g. base32 string)
    backup_codes VARCHAR,                 -- JSON array of one-time backup codes
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
