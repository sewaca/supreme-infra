-- Initial schema for core-schedule database
-- This script is executed automatically when PostgreSQL starts for the first time

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Teacher cache (mirrors User data from core-client-info)
CREATE TABLE IF NOT EXISTS teacher_cache (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Classrooms (auditoriums)
CREATE TABLE IF NOT EXISTS classroom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    building VARCHAR,
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Semesters
CREATE TABLE IF NOT EXISTS semester (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cycle_anchor_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_semester_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_semester_is_active ON semester(is_active);

-- Schedule template (two-week recurring pattern)
CREATE TABLE IF NOT EXISTS schedule_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    week_number SMALLINT NOT NULL,
    day_of_week SMALLINT NOT NULL,
    slot_number SMALLINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_name VARCHAR NOT NULL,
    lesson_type VARCHAR NOT NULL,
    teacher_id UUID,
    group_name VARCHAR NOT NULL,
    classroom_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_template_week CHECK (week_number IN (1, 2)),
    CONSTRAINT ck_template_dow CHECK (day_of_week BETWEEN 0 AND 5),
    CONSTRAINT ck_template_slot CHECK (slot_number BETWEEN 1 AND 8),
    CONSTRAINT uq_template_slot UNIQUE (semester_id, week_number, day_of_week, slot_number, group_name)
);

CREATE INDEX IF NOT EXISTS ix_schedule_template_semester_group ON schedule_template(semester_id, group_name);
CREATE INDEX IF NOT EXISTS ix_schedule_template_semester_teacher ON schedule_template(semester_id, teacher_id);

-- Schedule overrides (force-majeure changes on specific dates)
CREATE TABLE IF NOT EXISTS schedule_override (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_number SMALLINT NOT NULL,
    group_name VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    new_subject_name VARCHAR,
    new_lesson_type VARCHAR,
    new_teacher_id UUID,
    new_classroom_name VARCHAR,
    new_start_time TIME,
    new_end_time TIME,
    comment VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_override_slot UNIQUE (semester_id, date, slot_number, group_name)
);

CREATE INDEX IF NOT EXISTS ix_schedule_override_lookup ON schedule_override(semester_id, date, group_name);

-- Session events (exams, credits, consultations)
CREATE TABLE IF NOT EXISTS session_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_number SMALLINT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_name VARCHAR NOT NULL,
    lesson_type VARCHAR NOT NULL,
    teacher_id UUID,
    group_name VARCHAR NOT NULL,
    classroom_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_session_event_semester_group ON session_event(semester_id, group_name);
CREATE INDEX IF NOT EXISTS ix_session_event_semester_teacher ON session_event(semester_id, teacher_id);
