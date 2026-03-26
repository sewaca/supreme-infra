-- Migration: Insert test data for user 550e8400-e29b-41d4-a716-446655440000
-- This migration ensures all test data exists in the database

-- Insert user applications
INSERT INTO user_application (id, user_id, application_type, application_number, additional_fields, start_date, end_date, is_active, notifications_count)
VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', '250/кс', '{"amount": 5000.00, "currency": "RUB", "order_id": "99999999-9999-9999-9999-999999999999"}', '2025-09-01 00:00:00+00', '2026-06-30 00:00:00+00', TRUE, 1),
    ('dddddddd-dddd-dddd-dddd-ddddddddddde', '550e8400-e29b-41d4-a716-446655440000', 'dormitory', 'ОБ-2022-042', '{"contractNumber": "ОБ-2022-042", "dormitoryName": "Общежитие №3", "address": "ул. Примерная, д. 10", "roomNumber": "305"}', '2022-09-01 00:00:00+00', '2026-06-30 00:00:00+00', TRUE, 2)
ON CONFLICT (id) DO UPDATE SET
    application_number = EXCLUDED.application_number,
    additional_fields = EXCLUDED.additional_fields;

-- Insert application notifications
INSERT INTO application_notification (id, application_id, severity, message, action)
VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'info', 'Стипендия будет начислена 15 числа', NULL),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'warning', 'Необходимо оплатить проживание до 25 числа', '/dormitory/payment'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef0', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'error', 'Требуется подписать дополнительное соглашение', '/dormitory/sign-agreement')
ON CONFLICT (id) DO NOTHING;

-- Insert reference orders (expanded set)
INSERT INTO reference_order (id, user_id, reference_type, type_label, status, order_date, pickup_point_id, virtual_only, storage_until, pdf_url)
VALUES
    ('88888888-8888-8888-8888-888888888888', '550e8400-e29b-41d4-a716-446655440000', 'rdzd', 'РЖД', 'ready', '2025-01-28 00:00:00+00', 'spbkt_hr', FALSE, '2025-02-14 00:00:00+00', '/references/88888888-8888-8888-8888-888888888888/pdf'),
    ('88888888-8888-8888-8888-888888888889', '550e8400-e29b-41d4-a716-446655440000', 'workplace', 'По месту работы', 'ready', '2025-02-01 00:00:00+00', 'spbgt_hr', FALSE, '2025-03-15 00:00:00+00', '/references/88888888-8888-8888-8888-888888888889/pdf'),
    ('88888888-8888-8888-8888-88888888888a', '550e8400-e29b-41d4-a716-446655440000', 'parents_workplace', 'По месту работы родителей', 'ready', '2025-01-25 00:00:00+00', 'spbgt_hr', FALSE, '2025-02-13 00:00:00+00', '/references/88888888-8888-8888-8888-88888888888a/pdf'),
    ('88888888-8888-8888-8888-88888888888b', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', 'О стипендии', 'ready', '2025-01-20 00:00:00+00', 'accounting', TRUE, '2025-02-15 00:00:00+00', '/references/88888888-8888-8888-8888-88888888888b/pdf'),
    ('88888888-8888-8888-8888-88888888888c', '550e8400-e29b-41d4-a716-446655440000', 'military', 'Для военкомата', 'ready', '2025-01-15 00:00:00+00', 'military_office', FALSE, '2025-02-14 00:00:00+00', '/references/88888888-8888-8888-8888-88888888888c/pdf'),
    ('88888888-8888-8888-8888-88888888888d', '550e8400-e29b-41d4-a716-446655440000', 'rdzd', 'РЖД', 'in_progress', '2025-02-05 00:00:00+00', 'spbkt_hr', FALSE, NULL, NULL),
    ('88888888-8888-8888-8888-88888888888e', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', 'О стипендии', 'pending', '2025-02-10 00:00:00+00', 'accounting', FALSE, NULL, NULL),
    ('88888888-8888-8888-8888-88888888888f', '550e8400-e29b-41d4-a716-446655440000', 'workplace', 'По месту работы', 'preparation', '2025-02-11 00:00:00+00', 'spbgt_hr', FALSE, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert orders (expanded set)
INSERT INTO "order" (id, user_id, type, number, title, date, additional_fields, pdf_url, actions)
VALUES
    ('99999999-9999-9999-9999-999999999999', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', '250/кс', 'Назначить стипендию', '2026-02-18', '{"comment": "№250/кс от 18.02.2026", "startDate": "2026-02-01", "endDate": "2026-04-30"}', '/orders/99999999-9999-9999-9999-999999999999/pdf', '{"primary": {"title": "Скачать PDF", "action": "/orders/99999999-9999-9999-9999-999999999999/pdf"}}'),
    ('99999999-9999-9999-9999-99999999999a', '550e8400-e29b-41d4-a716-446655440000', 'dormitory', '150/об', 'О заселении в общежитие', '2025-09-01', '{"comment": "№150/об от 01.09.2025", "dormitoryAddress": "ул. Примерная, д. 10", "roomNumber": "305"}', '/orders/99999999-9999-9999-9999-99999999999a/pdf', NULL),
    ('99999999-9999-9999-9999-99999999999b', '550e8400-e29b-41d4-a716-446655440000', 'education', '75/уч', 'О переводе на следующий курс', '2025-07-15', '{"comment": "№75/уч от 15.07.2025", "fromCourse": "3", "toCourse": "4"}', '/orders/99999999-9999-9999-9999-99999999999b/pdf', NULL),
    ('99999999-9999-9999-9999-99999999999c', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', '280/кс', 'Назначить повышенную стипендию', '2026-01-15', '{"comment": "№280/кс от 15.01.2026", "startDate": "2026-01-01", "endDate": "2026-06-30"}', '/orders/99999999-9999-9999-9999-99999999999c/pdf', '{"primary": {"title": "Скачать PDF", "action": "/orders/99999999-9999-9999-9999-99999999999c/pdf"}}'),
    ('99999999-9999-9999-9999-99999999999d', '550e8400-e29b-41d4-a716-446655440000', 'dormitory', '180/об', 'О переселении в общежитие', '2025-02-01', '{"comment": "№180/об от 01.02.2025", "dormitoryAddress": "ул. Примерная, д. 10", "roomNumber": "412"}', '/orders/99999999-9999-9999-9999-99999999999d/pdf', NULL),
    ('99999999-9999-9999-9999-99999999999e', '550e8400-e29b-41d4-a716-446655440000', 'education', '90/уч', 'О допуске к сессии', '2026-01-10', '{"comment": "№90/уч от 10.01.2026"}', '/orders/99999999-9999-9999-9999-99999999999e/pdf', NULL),
    ('99999999-9999-9999-9999-99999999999f', '550e8400-e29b-41d4-a716-446655440000', 'general', '45/общ', 'О назначении старостой группы', '2025-09-15', '{"comment": "№45/общ от 15.09.2025"}', '/orders/99999999-9999-9999-9999-99999999999f/pdf', NULL),
    ('99999999-9999-9999-9999-999999999a00', '550e8400-e29b-41d4-a716-446655440000', 'general', '52/общ', 'О направлении на практику', '2025-06-01', '{"comment": "№52/общ от 01.06.2025", "practicePlace": "ООО \"ТехноСофт\""}', '/orders/99999999-9999-9999-9999-999999999a00/pdf', NULL),
    ('99999999-9999-9999-9999-999999999a01', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', '200/кс', 'Назначить стипендию', '2025-09-01', '{"comment": "№200/кс от 01.09.2025", "startDate": "2025-09-01", "endDate": "2026-01-31"}', '/orders/99999999-9999-9999-9999-999999999a01/pdf', NULL),
    ('99999999-9999-9999-9999-999999999a02', '550e8400-e29b-41d4-a716-446655440000', 'education', '60/уч', 'Об утверждении темы ВКР', '2026-02-01', '{"comment": "№60/уч от 01.02.2026", "topic": "Разработка системы мониторинга микросервисов"}', '/orders/99999999-9999-9999-9999-999999999a02/pdf', NULL),
    ('99999999-9999-9999-9999-999999999a03', '550e8400-e29b-41d4-a716-446655440000', 'general', '70/общ', 'О предоставлении академического отпуска', '2024-09-01', '{"comment": "№70/общ от 01.09.2024"}', NULL, NULL),
    ('99999999-9999-9999-9999-999999999a04', '550e8400-e29b-41d4-a716-446655440000', 'dormitory', '120/об', 'О продлении договора проживания', '2025-08-20', '{"comment": "№120/об от 20.08.2025"}', '/orders/99999999-9999-9999-9999-999999999a04/pdf', NULL),
    ('99999999-9999-9999-9999-999999999a05', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', '310/кс', 'О лишении стипендии', '2025-02-01', '{"comment": "№310/кс от 01.02.2025"}', NULL, NULL),
    ('99999999-9999-9999-9999-999999999a06', '550e8400-e29b-41d4-a716-446655440000', 'education', '110/уч', 'О зачислении', '2022-09-01', '{"comment": "№110/уч от 01.09.2022", "faculty": "ИТПИ", "specialty": "09.03.04"}', '/orders/99999999-9999-9999-9999-999999999a06/pdf', NULL),
    ('99999999-9999-9999-9999-999999999a07', '550e8400-e29b-41d4-a716-446655440000', 'general', '88/общ', 'О поощрении за участие в олимпиаде', '2025-12-15', '{"comment": "№88/общ от 15.12.2025"}', '/orders/99999999-9999-9999-9999-999999999a07/pdf', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert order notifications
INSERT INTO order_notification (id, order_id, severity, message, action)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'info', 'Стипендия будет начислена 15 числа', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '99999999-9999-9999-9999-99999999999a', 'warning', 'Необходимо подписать договор в течение 7 дней', '/dormitory/sign-contract'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '99999999-9999-9999-9999-99999999999c', 'success', 'Повышенная стипендия одобрена', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '99999999-9999-9999-9999-99999999999e', 'info', 'Допуск к сессии подтверждён', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '99999999-9999-9999-9999-999999999a02', 'warning', 'Необходимо утвердить тему ВКР у научного руководителя', NULL)
ON CONFLICT (id) DO NOTHING;
