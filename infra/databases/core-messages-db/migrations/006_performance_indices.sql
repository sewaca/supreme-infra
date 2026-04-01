-- Performance indices for core-messages
-- Fixes N+1 bottlenecks and adds missing composite indices

-- Composite index for GET /conversations:
-- JOIN filter: user_id = :id AND is_deleted = false AND conversation_id = ANY(...)
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_cp_user_deleted_conv
    ON conversation_participant (user_id, is_deleted, conversation_id);

-- Composite index for ORDER BY last_message_at DESC NULLS LAST, id DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_conversation_lma_id
    ON conversation (last_message_at DESC NULLS LAST, id DESC);

-- Composite index for GET /conversations/{id}/messages:
-- WHERE conversation_id = :id AND is_deleted = false ORDER BY created_at DESC, id DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_message_conv_deleted_created
    ON message (conversation_id, is_deleted, created_at DESC, id DESC);

-- Index for batch reply_to lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_message_reply_to_id
    ON message (reply_to_id)
    WHERE reply_to_id IS NOT NULL;

-- Functional indices for case-insensitive user search
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_user_cache_name_lower
    ON user_cache (lower(name));

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_user_cache_last_name_lower
    ON user_cache (lower(last_name));
