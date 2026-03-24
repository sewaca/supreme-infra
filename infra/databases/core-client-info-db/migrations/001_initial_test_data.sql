-- Migration: Insert test data for user 550e8400-e29b-41d4-a716-446655440000
-- This migration ensures all test data exists in the database

-- Insert test user
INSERT INTO "user" (id, name, last_name, middle_name, email, avatar, birth_date, snils, snils_issue_date, region, course, faculty, specialty, direction, profile, "group", status, qualification, start_year, end_year, student_card_number, university, average_grade, education_form)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Иван',
    'Иванов',
    'Иванович',
    'ivan.ivanov@example.com',
    NULL,
    '2000-01-15',
    '123-456-789 00',
    '2015-06-01',
    'Санкт-Петербург',
    4,
    'ИТПИ',
    'Информатика и вычислительная техника',
    '09.03.04 - Программная инженерия',
    'Разработка программного обеспечения и приложений искусственного интеллекта в киберфизических системах',
    'ИКПИ-25',
    'Обучается (Бюджет)',
    'Бакалавр',
    2022,
    2026,
    '№ 9900051',
    'СПбГЭТУ «ЛЭТИ»',
    4.75,
    'full_time'
)
ON CONFLICT (id) DO NOTHING;

-- Insert user settings
INSERT INTO user_settings (id, user_id, is_new_message_notifications_enabled, is_schedule_change_notifications_enabled, telegram_token, vk_token)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '550e8400-e29b-41d4-a716-446655440000',
    TRUE,
    TRUE,
    NULL,
    NULL
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert rating level
INSERT INTO rating_level (id, user_id, level, current_xp)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '550e8400-e29b-41d4-a716-446655440000',
    'advanced',
    850
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert ranking positions (expanded: 5 types)
INSERT INTO ranking_position (id, user_id, ranking_type, position, total, percentile)
VALUES
    ('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', 'byCourse', 3, 120, 97.50),
    ('44444444-4444-4444-4444-444444444445', '550e8400-e29b-41d4-a716-446655440000', 'byFaculty', 15, 450, 96.67),
    ('44444444-4444-4444-4444-444444444446', '550e8400-e29b-41d4-a716-446655440000', 'byUniversity', 45, 2500, 98.20),
    ('44444444-4444-4444-4444-444444444447', '550e8400-e29b-41d4-a716-446655440000', 'bySpecialty', 8, 200, 96.00),
    ('44444444-4444-4444-4444-444444444448', '550e8400-e29b-41d4-a716-446655440000', 'byAttendance', 12, 120, 90.00)
ON CONFLICT (user_id, ranking_type) DO NOTHING;

-- Insert user achievements (all 9 types, some unlocked, some in progress)
INSERT INTO user_achievement (id, user_id, achievement_id, unlocked, unlocked_at, progress, max_progress, times_earned)
VALUES
    ('55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440000', 'excellent_student', TRUE, '2025-12-15 10:00:00+00', 1, 1, 3),
    ('55555555-5555-5555-5555-555555555556', '550e8400-e29b-41d4-a716-446655440000', 'unstoppable', TRUE, '2025-11-20 14:00:00+00', 1, 1, 1),
    ('55555555-5555-5555-5555-555555555557', '550e8400-e29b-41d4-a716-446655440000', 'top_1_percent', FALSE, NULL, 45, 100, 0),
    ('55555555-5555-5555-5555-555555555558', '550e8400-e29b-41d4-a716-446655440000', 'first_try', FALSE, NULL, 60, 100, 0),
    ('55555555-5555-5555-5555-555555555559', '550e8400-e29b-41d4-a716-446655440000', 'perfectionist', FALSE, NULL, 30, 100, 0),
    ('55555555-5555-5555-5555-55555555555a', '550e8400-e29b-41d4-a716-446655440000', 'group_leader', TRUE, '2025-09-15 09:00:00+00', 1, 1, 2),
    ('55555555-5555-5555-5555-55555555555b', '550e8400-e29b-41d4-a716-446655440000', 'communicative', FALSE, NULL, 70, 100, 0),
    ('55555555-5555-5555-5555-55555555555c', '550e8400-e29b-41d4-a716-446655440000', 'early_bird', TRUE, '2026-01-10 08:00:00+00', 1, 1, 4),
    ('55555555-5555-5555-5555-55555555555d', '550e8400-e29b-41d4-a716-446655440000', 'iron_man', FALSE, NULL, 15, 100, 0)
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- Insert streak
INSERT INTO streak (id, user_id, current, best, last_updated)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    '550e8400-e29b-41d4-a716-446655440000',
    15,
    28,
    '2026-03-10 08:00:00+00'
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert user grades
INSERT INTO user_grade (id, user_id, subject, grade, grade_type, grade_date)
VALUES
    ('77777777-7777-7777-7777-777777777777', '550e8400-e29b-41d4-a716-446655440000', 'Математический анализ', 5.0, 'exam', '2026-01-20 10:00:00+00'),
    ('77777777-7777-7777-7777-777777777778', '550e8400-e29b-41d4-a716-446655440000', 'Программирование', 5.0, 'exam', '2026-01-22 14:00:00+00'),
    ('77777777-7777-7777-7777-777777777779', '550e8400-e29b-41d4-a716-446655440000', 'Базы данных', 4.0, 'exam', '2026-01-25 10:00:00+00'),
    ('77777777-7777-7777-7777-77777777777a', '550e8400-e29b-41d4-a716-446655440000', 'Английский язык', 5.0, 'credit', '2026-01-18 12:00:00+00'),
    ('77777777-7777-7777-7777-77777777777b', '550e8400-e29b-41d4-a716-446655440000', 'Алгоритмы и структуры данных', 4.0, 'exam', '2025-06-20 10:00:00+00'),
    ('77777777-7777-7777-7777-77777777777c', '550e8400-e29b-41d4-a716-446655440000', 'Веб-разработка', 4.5, 'exam', '2025-06-22 14:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Insert subject choice
INSERT INTO subject_choice (id, choice_id, deadline_date, is_active)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'math_electives_2026',
    '2026-04-01 23:59:59+00',
    TRUE
)
ON CONFLICT (choice_id) DO NOTHING;

-- Insert user subject priorities
INSERT INTO user_subject_priority (id, user_id, choice_id, subject_id, priority)
VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '550e8400-e29b-41d4-a716-446655440000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-3', 0),
    ('cccccccc-cccc-cccc-cccc-cccccccccccd', '550e8400-e29b-41d4-a716-446655440000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-2', 1),
    ('cccccccc-cccc-cccc-cccc-ccccccccccce', '550e8400-e29b-41d4-a716-446655440000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-1', 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccf', '550e8400-e29b-41d4-a716-446655440000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-4', 3)
ON CONFLICT (user_id, choice_id, subject_id) DO NOTHING;
