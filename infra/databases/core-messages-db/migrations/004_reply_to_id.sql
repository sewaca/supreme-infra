-- Migration: add reply_to_id to message table
ALTER TABLE message ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES message(id) ON DELETE SET NULL;
