-- Migration: New discipline choices for selection (8th semester)

-- Deactivate expired choices from previous semester
UPDATE subject_choice SET is_active = FALSE
WHERE choice_id IN ('math', 'physics', 'programming')
  AND deadline_date < NOW();

-- New discipline choices for semester 8
INSERT INTO subject_choice (id, choice_id, deadline_date, is_active, subjects)
VALUES
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd01',
        'elective-languages',
        '2026-09-15 23:59:59+00',
        TRUE,
        '[
            {"id": "lang-1", "name": "Деловой английский язык", "teacher": "Фролова К.В."},
            {"id": "lang-2", "name": "Технический английский для IT-специалистов", "teacher": "Зайцева П.Н."},
            {"id": "lang-3", "name": "Немецкий язык в профессиональной коммуникации", "teacher": "Ларионов А.Г."},
            {"id": "lang-4", "name": "Китайский язык (базовый)", "teacher": "Чернышёва Д.О."}
        ]'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd02',
        'elective-humanities',
        '2026-09-15 23:59:59+00',
        TRUE,
        '[
            {"id": "hum-1", "name": "Этика и профессиональная ответственность инженера", "teacher": "Громов В.С."},
            {"id": "hum-2", "name": "История науки и техники", "teacher": "Тихомирова Л.Е."},
            {"id": "hum-3", "name": "Психология управления и лидерства", "teacher": "Носов Ю.И."}
        ]'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd03',
        'elective-special-tech',
        '2026-09-15 23:59:59+00',
        TRUE,
        '[
            {"id": "tech-1", "name": "DevOps и автоматизация развёртывания", "teacher": "Кириллов М.Д."},
            {"id": "tech-2", "name": "Безопасность веб-приложений (OWASP)", "teacher": "Власова Т.Р."},
            {"id": "tech-3", "name": "Высоконагруженные системы и масштабирование", "teacher": "Шестаков Н.В."},
            {"id": "tech-4", "name": "Методологии разработки ПО (Agile, Scrum, SAFe)", "teacher": "Орехова С.Ф."}
        ]'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd04',
        'elective-data-science',
        '2026-09-15 23:59:59+00',
        TRUE,
        '[
            {"id": "ds-1", "name": "Глубокое обучение и нейронные сети", "teacher": "Мещеряков П.А."},
            {"id": "ds-2", "name": "Анализ больших данных (Big Data)", "teacher": "Савина И.Б."},
            {"id": "ds-3", "name": "Компьютерное зрение", "teacher": "Федотов Г.Л."}
        ]'
    )
ON CONFLICT (choice_id) DO NOTHING;
