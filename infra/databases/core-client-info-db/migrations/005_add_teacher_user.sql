-- Migration: Add test teacher user (Коробов С.А.)
-- UUID matches core-auth + core-schedule teacher_cache: d0000000-0000-0000-0000-000000000001

-- ─── user ───────────────────────────────────────────────────────────────────────
-- Student-specific fields (course, group, specialty, direction, profile,
-- qualification, start_year, end_year, student_card_number, average_grade,
-- education_form) are NULL for teachers.

INSERT INTO "user" (
    id, name, last_name, middle_name, email, avatar,
    birth_date, snils, snils_issue_date, region,
    course, faculty, specialty, direction, profile,
    "group", status, qualification,
    start_year, end_year, student_card_number,
    university, average_grade, education_form
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'Сергей',
    'Коробов',
    'Александрович',
    'korobov@example.com',
    NULL,
    '1975-03-12',
    NULL, NULL, 'Санкт-Петербург',
    NULL,                                          -- course
    'ИТПИ',                                        -- faculty / department
    NULL, NULL, NULL,                              -- specialty, direction, profile
    NULL,                                          -- group
    'Преподаватель',                               -- status
    NULL,                                          -- qualification
    NULL, NULL, NULL,                              -- start_year, end_year, student_card_number
    'СПбГУТ им. Бонч-Бруевича',
    NULL,                                          -- average_grade
    NULL                                           -- education_form
)
ON CONFLICT (id) DO NOTHING;

-- ─── user_settings ──────────────────────────────────────────────────────────────

INSERT INTO user_settings (
    id, user_id,
    is_new_message_notifications_enabled,
    is_schedule_change_notifications_enabled,
    telegram_token, vk_token
) VALUES (
    'd1111111-1111-1111-1111-111111111101',
    'd0000000-0000-0000-0000-000000000001',
    TRUE, TRUE, NULL, NULL
)
ON CONFLICT (user_id) DO NOTHING;

-- ─── rating_level ───────────────────────────────────────────────────────────────
-- Teachers don't participate in student rating, but a row is still required
-- for the profile page to render without errors.

INSERT INTO rating_level (id, user_id, level, current_xp)
VALUES (
    'd3333333-3333-3333-3333-333333333301',
    'd0000000-0000-0000-0000-000000000001',
    'beginner',
    0
)
ON CONFLICT (user_id) DO NOTHING;
