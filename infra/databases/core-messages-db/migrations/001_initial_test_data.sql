-- Migration: Insert test data for core-messages
-- Test users (must match core-client-info test data):
--   Student:  550e8400-e29b-41d4-a716-446655440000 — Иван Иванов
--   Teacher:  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa — Мария Петрова
--   Student2: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb — Алексей Сидоров

-- ─── user_cache ────────────────────────────────────────────────────────────────

INSERT INTO user_cache (user_id, name, last_name, middle_name, email, avatar, group_name, faculty, role, cached_at)
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440000',
        'Иван', 'Иванов', 'Иванович',
        'ivan.ivanov@example.com', NULL,
        'ИКПИ-25', 'ИТПИ', 'student',
        NOW()
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Мария', 'Петрова', 'Сергеевна',
        'moder@example.com', NULL,
        NULL, NULL, 'teacher',
        NOW()
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Алексей', 'Сидоров', 'Дмитриевич',
        'sidorov@example.com', NULL,
        'ИКПИ-25', 'ИТПИ', 'student',
        NOW()
    )
ON CONFLICT (user_id) DO NOTHING;

-- ─── Direct conversation: Иван ↔ Мария ────────────────────────────────────────
-- Conversation ID: cccccccc-cccc-cccc-cccc-cccccccccccc
-- Messages:
--   cc100001-... — от Марии: «Иван, напомни пожалуйста...»
--   cc100002-... — от Ивана: «Да, сдал вчера вечером.»
--   cc100003-... — от Ивана: «Хорошо, увидимся!»

INSERT INTO conversation (id, type, title, owner_id, last_message_at, last_message_preview, last_message_sender_id, created_at, updated_at)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'direct', NULL, NULL,
    '2026-03-29 18:30:00+00',
    'Хорошо, увидимся!',
    '550e8400-e29b-41d4-a716-446655440000',
    '2026-03-29 18:00:00+00',
    '2026-03-29 18:30:00+00'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO message (id, conversation_id, sender_id, content, content_type, created_at, is_deleted)
VALUES
    (
        'cc100001-cccc-cccc-cccc-000000000001',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Иван, напомни пожалуйста — ты сдал лабораторную работу по сетям?',
        'text',
        '2026-03-29 18:00:00+00',
        FALSE
    ),
    (
        'cc100002-cccc-cccc-cccc-000000000002',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '550e8400-e29b-41d4-a716-446655440000',
        'Да, сдал вчера вечером. Всё прошло хорошо.',
        'text',
        '2026-03-29 18:15:00+00',
        FALSE
    ),
    (
        'cc100003-cccc-cccc-cccc-000000000003',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '550e8400-e29b-41d4-a716-446655440000',
        'Хорошо, увидимся!',
        'text',
        '2026-03-29 18:30:00+00',
        FALSE
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_participant (id, conversation_id, user_id, role, can_reply, last_read_message_id, last_read_at, is_deleted, joined_at, peer_display_name)
VALUES
    (
        'cc200001-cccc-cccc-cccc-000000000001',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '550e8400-e29b-41d4-a716-446655440000',
        'member', TRUE,
        'cc100003-cccc-cccc-cccc-000000000003',
        '2026-03-29 18:31:00+00',
        FALSE,
        '2026-03-29 18:00:00+00',
        'Мария Петрова'
    ),
    (
        'cc200002-cccc-cccc-cccc-000000000002',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'member', TRUE,
        'cc100003-cccc-cccc-cccc-000000000003',
        '2026-03-29 18:31:00+00',
        FALSE,
        '2026-03-29 18:00:00+00',
        'Иван Иванов'
    )
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- ─── Broadcast conversation: Мария → ИКПИ-25 ──────────────────────────────────
-- Conversation ID: dddddddd-dddd-dddd-dddd-dddddddddddd
-- Message:
--   dd100001-... — от Марии: «Завтра в 14:00 пара переносится...»

INSERT INTO conversation (id, type, title, owner_id, last_message_at, last_message_preview, last_message_sender_id, created_at, updated_at)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'broadcast',
    'Объявление для группы ИКПИ-25',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2026-03-29 10:00:00+00',
    'Завтра в 14:00 пара переносится в аудиторию 305.',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2026-03-29 10:00:00+00',
    '2026-03-29 10:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO message (id, conversation_id, sender_id, content, content_type, created_at, is_deleted)
VALUES (
    'dd100001-dddd-dddd-dddd-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Завтра в 14:00 пара переносится в аудиторию 305.',
    'text',
    '2026-03-29 10:00:00+00',
    FALSE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_participant (id, conversation_id, user_id, role, can_reply, last_read_message_id, last_read_at, is_deleted, joined_at, peer_display_name)
VALUES
    (
        'dd200001-dddd-dddd-dddd-000000000001',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'owner', TRUE,
        'dd100001-dddd-dddd-dddd-000000000001',
        '2026-03-29 10:00:00+00',
        FALSE,
        '2026-03-29 10:00:00+00',
        NULL
    ),
    (
        'dd200002-dddd-dddd-dddd-000000000002',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '550e8400-e29b-41d4-a716-446655440000',
        'member', FALSE,
        NULL, NULL, FALSE,
        '2026-03-29 10:00:00+00',
        NULL
    ),
    (
        'dd200003-dddd-dddd-dddd-000000000003',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'member', FALSE,
        NULL, NULL, FALSE,
        '2026-03-29 10:00:00+00',
        NULL
    )
ON CONFLICT (conversation_id, user_id) DO NOTHING;
