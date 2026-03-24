-- Migration: Insert test data for core-auth
-- Test passwords (bcrypt, 10 rounds):
--   ivan.ivanov@example.com → password123
--   admin@example.com       → admin123

INSERT INTO auth_user (id, email, password_hash, name, role, is_active)
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440000',
        'ivan.ivanov@example.com',
        '$2b$10$LGv3x4Qwrldp/rxyqj9GE.sqEA5nr2F3YeoOz5lsjynjtPXDyBoeG',
        'Иван Иванов',
        'student',
        TRUE
    ),
    (
        '550e8400-e29b-41d4-a716-446655440001',
        'admin@example.com',
        '$2b$10$kQvd0S9xkZvi2Z7eakrGuOm40tUppegAXqOqgc2CKylU1dhXKZ9tO',
        'Admin User',
        'admin',
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- Initialize empty 2FA records for test users
INSERT INTO two_factor_auth (id, user_id, is_enabled)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '550e8400-e29b-41d4-a716-446655440000', FALSE),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '550e8400-e29b-41d4-a716-446655440001', FALSE)
ON CONFLICT (user_id) DO NOTHING;
