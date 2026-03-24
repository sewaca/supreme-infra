-- Migration: Insert test data for core-auth
-- Passwords (bcrypt, 10 rounds) — password equals email:
--   ivan.ivanov@example.com → ivan.ivanov@example.com
--   admin@example.com       → admin@example.com
--   moder@example.com       → moder@example.com
--   user@example.com        → user@example.com

INSERT INTO auth_user (id, email, password_hash, name, role, is_active)
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440000',
        'ivan.ivanov@example.com',
        '$2b$10$Gku378t5xx.1thClo0iIcO5CqJ8RGfLE/SP4Rsa0NUxmi7t32gFZC',
        'Иван Иванов',
        'student',
        TRUE
    ),
    (
        '550e8400-e29b-41d4-a716-446655440001',
        'admin@example.com',
        '$2b$10$xRN27F1m3yprVLU64l.3HOlrgcEzh9LjoISiX/RsOC0r/1lbMLxgy',
        'Admin',
        'admin',
        TRUE
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002',
        'moder@example.com',
        '$2b$10$KCbwZyrJM5Wu693Nd8pN/u2o0XeXrwoF3xOaf5O8gP13fCiZwN3/i',
        'Moder',
        'moderator',
        TRUE
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003',
        'user@example.com',
        '$2b$10$zLWk1Ytnsh8gII7h9JEWzeNnFyY70g6MJ8RetprYVvQKEzgHh1Pqy',
        'User',
        'student',
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- Initialize empty 2FA records
INSERT INTO two_factor_auth (id, user_id, is_enabled)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '550e8400-e29b-41d4-a716-446655440000', FALSE),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '550e8400-e29b-41d4-a716-446655440001', FALSE),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '550e8400-e29b-41d4-a716-446655440002', FALSE),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '550e8400-e29b-41d4-a716-446655440003', FALSE)
ON CONFLICT (user_id) DO NOTHING;
