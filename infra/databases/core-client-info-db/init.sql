-- Initial schema for core-client-info database
-- This script is executed automatically when PostgreSQL starts for the first time

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    is_new_message_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_schedule_change_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    telegram_token VARCHAR,
    vk_token VARCHAR,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    course INTEGER,
    faculty VARCHAR,
    specialty VARCHAR,
    direction VARCHAR,
    profile VARCHAR,
    "group" VARCHAR,
    status VARCHAR,
    qualification VARCHAR,
    start_year INTEGER,
    end_year INTEGER,
    student_card_number VARCHAR,
    university VARCHAR,
    average_grade NUMERIC(4, 2),
    education_form VARCHAR,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rating_level (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    level VARCHAR NOT NULL DEFAULT 'novice',
    current_xp INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranking_position (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ranking_type VARCHAR NOT NULL,
    position INTEGER NOT NULL,
    total INTEGER NOT NULL,
    percentile NUMERIC(5, 2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_position_user_id ON ranking_position(user_id);

CREATE TABLE IF NOT EXISTS user_achievement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id VARCHAR NOT NULL,
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    progress INTEGER NOT NULL DEFAULT 0,
    max_progress INTEGER NOT NULL DEFAULT 1,
    times_earned INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_achievement_user_id ON user_achievement(user_id);

CREATE TABLE IF NOT EXISTS streak (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    current INTEGER NOT NULL DEFAULT 0,
    best INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_grade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject VARCHAR NOT NULL,
    grade NUMERIC(4, 2) NOT NULL,
    grade_type VARCHAR NOT NULL,
    grade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_grade_user_id ON user_grade(user_id);

CREATE TABLE IF NOT EXISTS subject_choice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    choice_id VARCHAR UNIQUE NOT NULL,
    deadline_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_subject_priority (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    choice_id UUID NOT NULL REFERENCES subject_choice(id) ON DELETE CASCADE,
    subject_id VARCHAR NOT NULL,
    priority INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subject_priority_user_id ON user_subject_priority(user_id);

-- Insert test data for user_id: 550e8400-e29b-41d4-a716-446655440000

INSERT INTO user_settings (id, user_id, is_new_message_notifications_enabled, is_schedule_change_notifications_enabled, telegram_token, vk_token) VALUES ('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', TRUE, TRUE, NULL, NULL) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student_stats (id, user_id, course, faculty, specialty, "group", average_grade, education_form, university, start_year, end_year, student_card_number) VALUES ('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 4, 'ИТПИ', '09.03.04 - Программная инженерия', 'ИКПИ-25', 4.75, 'Очная', 'Университет телекоммуникаций', 2022, 2026, 'СТ-2022-12345') ON CONFLICT (user_id) DO NOTHING;

INSERT INTO rating_level (id, user_id, level, current_xp) VALUES ('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', 'advanced', 850) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO ranking_position (id, user_id, ranking_type, position, total, percentile) VALUES ('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', 'byCourse', 5, 120, 95.83), ('44444444-4444-4444-4444-444444444445', '550e8400-e29b-41d4-a716-446655440000', 'byFaculty', 15, 500, 97.00), ('44444444-4444-4444-4444-444444444446', '550e8400-e29b-41d4-a716-446655440000', 'byUniversity', 42, 5000, 99.16);

INSERT INTO user_achievement (id, user_id, achievement_id, unlocked, unlocked_at, progress, max_progress, times_earned) VALUES ('55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440000', 'excellent_student', TRUE, '2025-12-15 10:00:00+00', 1, 1, 2), ('55555555-5555-5555-5555-555555555556', '550e8400-e29b-41d4-a716-446655440000', 'perfect_attendance', TRUE, '2025-11-01 10:00:00+00', 1, 1, 1), ('55555555-5555-5555-5555-555555555557', '550e8400-e29b-41d4-a716-446655440000', 'quick_learner', FALSE, NULL, 7, 10, 0);

INSERT INTO streak (id, user_id, current, best, last_updated) VALUES ('66666666-6666-6666-6666-666666666666', '550e8400-e29b-41d4-a716-446655440000', 15, 42, '2026-03-10 08:00:00+00') ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_grade (id, user_id, subject, grade, grade_type, grade_date) VALUES ('77777777-7777-7777-7777-777777777777', '550e8400-e29b-41d4-a716-446655440000', 'Математический анализ', 5.0, 'exam', '2026-01-20 10:00:00+00'), ('77777777-7777-7777-7777-777777777778', '550e8400-e29b-41d4-a716-446655440000', 'Программирование', 5.0, 'exam', '2026-01-22 14:00:00+00'), ('77777777-7777-7777-7777-777777777779', '550e8400-e29b-41d4-a716-446655440000', 'Базы данных', 4.0, 'exam', '2026-01-25 10:00:00+00'), ('77777777-7777-7777-7777-77777777777a', '550e8400-e29b-41d4-a716-446655440000', 'Английский язык', 5.0, 'credit', '2026-01-18 12:00:00+00');

INSERT INTO subject_choice (id, choice_id, deadline_date, is_active) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math_electives_2026', '2026-04-01 23:59:59+00', TRUE) ON CONFLICT (choice_id) DO NOTHING;

INSERT INTO user_subject_priority (id, user_id, choice_id, subject_id, priority) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '550e8400-e29b-41d4-a716-446655440000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-1', 0), ('cccccccc-cccc-cccc-cccc-cccccccccccd', '550e8400-e29b-41d4-a716-446655440000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-3', 1), ('cccccccc-cccc-cccc-cccc-ccccccccccce', '550e8400-e29b-41d4-a716-446655440000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-2', 2);
