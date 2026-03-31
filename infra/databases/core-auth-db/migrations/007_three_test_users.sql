-- Migration: Auth for София, Михаил, Анна (id совпадают с core-client-info / core-messages)
-- Пароль для входа совпадает с email (bcrypt, 10 rounds)

INSERT INTO auth_user (id, email, password_hash, name, role, is_active)
VALUES
    (
        'f1000000-0000-0000-0000-000000000001',
        'sofia.volkova@example.com',
        '$2a$10$YBo5SzX38Jo1YKmTAAQ20umnYL5expLvj.3yiH9pdiinTfIFZk1im',
        'София Волкова',
        'student',
        TRUE
    ),
    (
        'f1000000-0000-0000-0000-000000000002',
        'mikhail.orlov@example.com',
        '$2a$10$u3fV/O/CkuSUojpk1UNSnOwjxwm6DH/knVz5EK7vXuIiMYAlzWA1C',
        'Михаил Орлов',
        'student',
        TRUE
    ),
    (
        'f1000000-0000-0000-0000-000000000003',
        'anna.zhukova@example.com',
        '$2a$10$3G1IKO1TU7pBNre3/X4qqeDdYTsRFvygricJwx2.fSvu136VBy.IG',
        'Анна Жукова',
        'student',
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO two_factor_auth (id, user_id, is_enabled)
VALUES
    ('f2fa0000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', FALSE),
    ('f2fa0000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', FALSE),
    ('f2fa0000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000003', FALSE)
ON CONFLICT (user_id) DO NOTHING;
