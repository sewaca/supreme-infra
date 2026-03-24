-- Initial schema for core-client-info database
-- This script is executed automatically when PostgreSQL starts for the first time

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Personal info
    name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    middle_name VARCHAR,
    email VARCHAR UNIQUE NOT NULL,
    avatar VARCHAR,
    birth_date DATE,
    snils VARCHAR,
    snils_issue_date DATE,
    region VARCHAR,
    -- Academic info
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    is_new_message_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_schedule_change_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    telegram_token VARCHAR,
    vk_token VARCHAR,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rating_level (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    level VARCHAR NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, ranking_type)
);

CREATE TABLE IF NOT EXISTS user_achievement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id VARCHAR NOT NULL,
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    progress INTEGER NOT NULL DEFAULT 0,
    max_progress INTEGER NOT NULL,
    times_earned INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

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
    grade NUMERIC(4, 2),
    grade_type VARCHAR NOT NULL,
    grade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    course INTEGER NOT NULL DEFAULT 1,
    semester INTEGER NOT NULL DEFAULT 1,
    hours INTEGER NOT NULL DEFAULT 0,
    teacher VARCHAR NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_grade_user_id ON user_grade(user_id);
CREATE INDEX IF NOT EXISTS idx_user_grade_date ON user_grade(grade_date);

CREATE TABLE IF NOT EXISTS subject_choice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    choice_id VARCHAR UNIQUE NOT NULL,
    deadline_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    subjects JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subject_priority (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    choice_id UUID NOT NULL REFERENCES subject_choice(id) ON DELETE CASCADE,
    subject_id VARCHAR NOT NULL,
    priority INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, choice_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subject_priority_user_id ON user_subject_priority(user_id);
