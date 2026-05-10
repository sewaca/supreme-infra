-- Migration: attestation table — Промежуточная аттестация

-- (1) attestation table -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attestation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject_name VARCHAR NOT NULL,
    is_attested BOOLEAN NOT NULL,
    reason TEXT,
    teacher_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    semester INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT attestation_reason_consistency CHECK (
        (is_attested = TRUE AND reason IS NULL) OR
        (is_attested = FALSE AND reason IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_attestation_user_id           ON attestation(user_id);
CREATE INDEX IF NOT EXISTS idx_attestation_teacher_id        ON attestation(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attestation_user_id_semester  ON attestation(user_id, semester);

-- (2) Seed data for Ivan Ivanov (550e8400-…000) using teacher UUIDs from 005/008 ---------
-- Teachers: Коробов (…001), Бондаренко (…002), Вивчарь (…005), Смирнов (…007),
--           Белая (…008), Мальцева (…010), Мутханна (…75d8…)
DELETE FROM attestation WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

INSERT INTO attestation (id, user_id, subject_name, is_attested, reason, teacher_id, semester) VALUES
    -- Семестр 7 (текущий)
    ('a0000000-0000-0000-0000-000000000001',
     '550e8400-e29b-41d4-a716-446655440000',
     'Облачные технологии в сетях связи',
     FALSE, 'Пропуск 3 практических работ',
     'd0000000-0000-5000-8000-75d80bef8748', 7),

    ('a0000000-0000-0000-0000-000000000002',
     '550e8400-e29b-41d4-a716-446655440000',
     'Безопасность жизнедеятельности',
     FALSE, 'Не сдан реферат',
     'd0000000-0000-0000-0000-000000000010', 7),

    ('a0000000-0000-0000-0000-000000000003',
     '550e8400-e29b-41d4-a716-446655440000',
     'Архитектура информационных систем',
     TRUE, NULL,
     'd0000000-0000-0000-0000-000000000002', 7),

    -- Семестр 6
    ('a0000000-0000-0000-0000-000000000004',
     '550e8400-e29b-41d4-a716-446655440000',
     'Разработка приложений ИИ в киберфизических системах',
     TRUE, NULL,
     'd0000000-0000-0000-0000-000000000008', 6),

    ('a0000000-0000-0000-0000-000000000005',
     '550e8400-e29b-41d4-a716-446655440000',
     'Машинное обучение',
     TRUE, NULL,
     'd0000000-0000-0000-0000-000000000005', 6),

    ('a0000000-0000-0000-0000-000000000006',
     '550e8400-e29b-41d4-a716-446655440000',
     'Базы данных',
     FALSE, 'Низкая активность на семинарах',
     'd0000000-0000-0000-0000-000000000007', 6),

    -- Семестр 5
    ('a0000000-0000-0000-0000-000000000007',
     '550e8400-e29b-41d4-a716-446655440000',
     'Программирование на Python',
     TRUE, NULL,
     'd0000000-0000-0000-0000-000000000001', 5)

ON CONFLICT (id) DO NOTHING;
