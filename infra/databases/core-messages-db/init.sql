-- Initial schema for core-messages database
-- This script is executed automatically when PostgreSQL starts for the first time

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,
    title VARCHAR(500),
    owner_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview VARCHAR(200),
    last_message_sender_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_conversation_last_message_at ON conversation (last_message_at);

CREATE TABLE IF NOT EXISTS conversation_participant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    can_reply BOOLEAN NOT NULL DEFAULT TRUE,
    last_read_message_id UUID,
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    peer_display_name VARCHAR(500),
    CONSTRAINT uq_conv_participant UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_conversation_participant_conversation_id ON conversation_participant (conversation_id);
CREATE INDEX IF NOT EXISTS ix_conversation_participant_user_id ON conversation_participant (user_id);

CREATE TABLE IF NOT EXISTS message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) NOT NULL DEFAULT 'text',
    content_search TSVECTOR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS ix_message_sender_id ON message (sender_id);
CREATE INDEX IF NOT EXISTS ix_messages_conversation_created ON message USING btree (conversation_id, created_at, id);
CREATE INDEX IF NOT EXISTS ix_messages_content_search ON message USING gin (content_search);

CREATE OR REPLACE FUNCTION messages_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.content_search := to_tsvector('russian', COALESCE(NEW.content, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update
  BEFORE INSERT OR UPDATE OF content ON message
  FOR EACH ROW EXECUTE FUNCTION messages_search_trigger();

CREATE TABLE IF NOT EXISTS message_attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES message(id) ON DELETE CASCADE,
    file_url VARCHAR(1000) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    thumbnail_url VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_message_attachment_message_id ON message_attachment (message_id);

CREATE TABLE IF NOT EXISTS user_cache (
    user_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    group_name VARCHAR(100),
    faculty VARCHAR(255),
    role VARCHAR(50),
    cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
