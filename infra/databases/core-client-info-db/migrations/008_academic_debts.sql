-- Migration: academic_debt table + teacher_id column in user_grade
-- Adds real teacher UUID linkage for Ivan Ivanov's grades where matches exist in teacher_cache

-- (1) Extend user_grade with teacher_id -------------------------------------------------
ALTER TABLE user_grade ADD COLUMN IF NOT EXISTS teacher_id UUID;
CREATE INDEX IF NOT EXISTS idx_user_grade_teacher_id ON user_grade(teacher_id);

-- (2) Seed teacher profiles (Korobov already exists from 005_add_teacher_user.sql) ------
INSERT INTO "user" (id, name, last_name, middle_name, email, status, faculty, university,
    birth_date, snils, snils_issue_date, region, course, specialty, direction, profile,
    "group", qualification, start_year, end_year, student_card_number, average_grade, education_form)
VALUES
    ('d0000000-0000-0000-0000-000000000002', 'Игорь',  'Бондаренко', 'Борисович',  'bondarenko@example.com', 'Преподаватель', 'ИТПИ', 'СПбГУТ им. Бонч-Бруевича', NULL, NULL, NULL, 'Санкт-Петербург', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('d0000000-0000-0000-0000-000000000005', 'Роман',  'Вивчарь',    'Михайлович', 'vivchar@example.com',    'Преподаватель', 'ИТПИ', 'СПбГУТ им. Бонч-Бруевича', NULL, NULL, NULL, 'Санкт-Петербург', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('d0000000-0000-0000-0000-000000000007', 'Кирилл', 'Смирнов',    'Александрович', 'smirnov@example.com', 'Преподаватель', 'ИТПИ', 'СПбГУТ им. Бонч-Бруевича', NULL, NULL, NULL, 'Санкт-Петербург', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('d0000000-0000-0000-0000-000000000008', 'Татьяна', 'Белая',     'Игоревна',   'belaya@example.com',     'Преподаватель', 'ИТПИ', 'СПбГУТ им. Бонч-Бруевича', NULL, NULL, NULL, 'Санкт-Петербург', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('d0000000-0000-0000-0000-000000000010', 'Ольга',  'Мальцева',   'Леонидовна', 'maltseva@example.com',   'Преподаватель', 'ИТПИ', 'СПбГУТ им. Бонч-Бруевича', NULL, NULL, NULL, 'Санкт-Петербург', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('d0000000-0000-5000-8000-75d80bef8748', 'Аммар',  'Мутханна',   'Салех Али',  'muthanna@example.com',   'Преподаватель', 'ИТПИ', 'СПбГУТ им. Бонч-Бруевича', NULL, NULL, NULL, 'Санкт-Петербург', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- (3) Fill user_grade.teacher_id for Ivan Ivanov's grades (only matched ФИО) -----------
UPDATE user_grade SET teacher_id = 'd0000000-0000-0000-0000-000000000001'
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND teacher = 'Коробов С.А.';
UPDATE user_grade SET teacher_id = 'd0000000-0000-0000-0000-000000000002'
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND teacher = 'Бондаренко И.Б.';
UPDATE user_grade SET teacher_id = 'd0000000-0000-0000-0000-000000000005'
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND teacher = 'Вивчарь Р.М.';
UPDATE user_grade SET teacher_id = 'd0000000-0000-0000-0000-000000000007'
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND teacher = 'Смирнов К.А.';
UPDATE user_grade SET teacher_id = 'd0000000-0000-0000-0000-000000000008'
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND teacher = 'Белая Т.И.';
UPDATE user_grade SET teacher_id = 'd0000000-0000-0000-0000-000000000010'
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND teacher = 'Мальцева О.Л.';
UPDATE user_grade SET teacher_id = 'd0000000-0000-5000-8000-75d80bef8748'
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND teacher = 'Мутханна А.-С.-А.';

-- (4) academic_debt table ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_debt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject VARCHAR NOT NULL,
    grade_type VARCHAR NOT NULL,
    course INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    hours INTEGER NOT NULL DEFAULT 0,
    teacher_id UUID NOT NULL,
    teacher_name VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    retake_date TIMESTAMP WITH TIME ZONE,
    retake_classroom VARCHAR,
    conversation_id UUID,
    requested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_debt_user_id ON academic_debt(user_id);

-- (5) Seed: Ivan Ivanov — 3 debts with different statuses --------------------------------
-- Uses real teacher UUIDs: Мальцева (d0...010), Мутханна (d0...75d8...), Белая (d0...008)
DELETE FROM academic_debt WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

INSERT INTO academic_debt (
    id, user_id, subject, grade_type, course, semester, hours,
    teacher_id, teacher_name, status,
    retake_date, retake_classroom, conversation_id, requested_at
) VALUES
    -- 1. pending — no request yet
    ('e0000000-0000-0000-0000-000000000001',
     '550e8400-e29b-41d4-a716-446655440000',
     'Безопасность жизнедеятельности', 'credit', 4, 7, 144,
     'd0000000-0000-0000-0000-000000000010', 'Мальцева О.Л.', 'pending',
     NULL, NULL, NULL, NULL),
    -- 2. requested — message sent to teacher, waiting for response
    ('e0000000-0000-0000-0000-000000000002',
     '550e8400-e29b-41d4-a716-446655440000',
     'Облачные технологии в сетях связи', 'credit', 4, 7, 108,
     'd0000000-0000-5000-8000-75d80bef8748', 'Мутханна А.-С.-А.', 'requested',
     NULL, NULL, NULL, '2026-05-08 10:00:00+00'),
    -- 3. scheduled — teacher confirmed retake date
    ('e0000000-0000-0000-0000-000000000003',
     '550e8400-e29b-41d4-a716-446655440000',
     'Разработка приложений искусственного интеллекта в киберфизических системах', 'credit', 3, 6, 108,
     'd0000000-0000-0000-0000-000000000008', 'Белая Т.И.', 'scheduled',
     '2026-05-20 14:00:00+00', 'Аудитория 412', NULL, '2026-05-05 09:30:00+00')
ON CONFLICT (id) DO NOTHING;
