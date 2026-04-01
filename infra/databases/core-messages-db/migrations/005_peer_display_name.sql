-- Migration: cached counterparty display name per participant row (direct chats)
ALTER TABLE conversation_participant ADD COLUMN IF NOT EXISTS peer_display_name VARCHAR(500);
