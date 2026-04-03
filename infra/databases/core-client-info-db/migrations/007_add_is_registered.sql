-- Migration: Add is_registered flag to user table.
-- Users without a core-auth account have is_registered = FALSE
-- and are returned by the registration lookup endpoint.
-- After registration this is set to TRUE and they are excluded from future lookups.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_registered BOOLEAN NOT NULL DEFAULT FALSE;
