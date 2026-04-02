-- Migration: Add test teacher user (Коробов С.А.)
-- UUID matches teacher_cache entry d0000000-0000-0000-0000-000000000001 in core-schedule-db
-- Password: korobov@example.com (bcrypt 10 rounds)

INSERT INTO auth_user (id, email, password_hash, name, role, is_active)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'korobov@example.com',
    '$2b$10$5LkvbGPSlUv/3RTC1aRfpOpah7t8hlq78UADcoJRqoyWBlPGr.E0G',
    'Коробов С.А.',
    'teacher',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO two_factor_auth (id, user_id, is_enabled)
VALUES (
    'd0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    FALSE
)
ON CONFLICT (user_id) DO NOTHING;
