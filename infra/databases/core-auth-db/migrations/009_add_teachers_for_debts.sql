-- Migration: Add teacher users needed for academic debts feature
-- Коробов С.А. already exists in 008_add_teacher_user.sql
-- Passwords = email (bcrypt 10 rounds)

INSERT INTO auth_user (id, email, password_hash, name, role, is_active) VALUES
    ('d0000000-0000-5000-8000-75d80bef8748', 'muthanna@example.com',  '$2b$10$xpW10rykW0/GrUEqg9DepuRTsuUUKEObmnIqsg18TsLrkgaZyZ65G', 'Мутханна А.-С.-А.', 'teacher', TRUE),
    ('d0000000-0000-0000-0000-000000000008', 'belaya@example.com',    '$2b$10$1Iw6Jypi1BJp5MWsavGrle1Ky1MeVJmN5z1BSQcJuz4qNcc4lrnbe', 'Белая Т.И.',        'teacher', TRUE),
    ('d0000000-0000-0000-0000-000000000010', 'maltseva@example.com',  '$2b$10$6Lk4G5g2AFG4wSe2a56fi.Vm5amAKlANPUnJCFy7H1nEbm6N0GhpG', 'Мальцева О.Л.',     'teacher', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO two_factor_auth (id, user_id, is_enabled) VALUES
    ('d0000000-0000-0000-0000-0000000000a1', 'd0000000-0000-5000-8000-75d80bef8748', FALSE),
    ('d0000000-0000-0000-0000-0000000000a2', 'd0000000-0000-0000-0000-000000000008', FALSE),
    ('d0000000-0000-0000-0000-0000000000a3', 'd0000000-0000-0000-0000-000000000010', FALSE)
ON CONFLICT (user_id) DO NOTHING;
