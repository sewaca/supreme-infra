-- Migration: Insert test data for user 550e8400-e29b-41d4-a716-446655440000
-- This migration ensures all test data exists in the database

-- Insert user applications
INSERT INTO user_application (id, user_id, application_type, application_number, additional_fields, start_date, end_date, is_active, notifications_count)
VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', 'СТ-2025-001', '{"amount": 5000.00, "currency": "RUB"}', '2025-09-01 00:00:00+00', '2026-06-30 00:00:00+00', TRUE, 1),
    ('dddddddd-dddd-dddd-dddd-ddddddddddde', '550e8400-e29b-41d4-a716-446655440000', 'dormitory', 'ОБ-2022-042', '{"contractNumber": "ОБ-2022-042", "dormitoryName": "Общежитие №3", "address": "ул. Примерная, д. 10", "roomNumber": "305"}', '2022-09-01 00:00:00+00', '2026-06-30 00:00:00+00', TRUE, 2)
ON CONFLICT (id) DO NOTHING;

-- Insert application notifications
INSERT INTO application_notification (id, application_id, severity, message, action)
VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'info', 'Стипендия будет начислена 15 числа', NULL),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'warning', 'Необходимо оплатить проживание до 25 числа', '/dormitory/payment'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef0', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'error', 'Требуется подписать дополнительное соглашение', '/dormitory/sign-agreement')
ON CONFLICT (id) DO NOTHING;

-- Insert reference orders
INSERT INTO reference_order (id, user_id, reference_type, type_label, status, order_date, pickup_point_id, virtual_only, storage_until, pdf_url)
VALUES
    ('88888888-8888-8888-8888-888888888888', '550e8400-e29b-41d4-a716-446655440000', 'rdzd', 'references.type.rdzd', 'ready', '2025-01-28 00:00:00+00', 'spbkt_hr', FALSE, '2025-02-14 00:00:00+00', '/references/88888888-8888-8888-8888-888888888888/pdf'),
    ('88888888-8888-8888-8888-888888888889', '550e8400-e29b-41d4-a716-446655440000', 'study_confirmation', 'references.type.study_confirmation', 'preparation', '2026-03-09 00:00:00+00', 'spbkt_hr', FALSE, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert orders
INSERT INTO "order" (id, user_id, type, number, title, date, additional_fields, pdf_url, actions)
VALUES
    ('99999999-9999-9999-9999-999999999999', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', '250/кс', 'Назначить стипендию', '2026-02-18', '{"comment": "№250/кс от 18.02.2026", "startDate": "2026-02-01", "endDate": "2026-04-30"}', '/orders/99999999-9999-9999-9999-999999999999/pdf', '{"primary": {"title": "Скачать PDF", "action": "/orders/99999999-9999-9999-9999-999999999999/pdf"}}'),
    ('99999999-9999-9999-9999-99999999999a', '550e8400-e29b-41d4-a716-446655440000', 'dormitory', '150/об', 'О заселении в общежитие', '2025-09-01', '{"comment": "№150/об от 01.09.2025", "dormitoryAddress": "ул. Примерная, д. 10", "roomNumber": "305"}', '/orders/99999999-9999-9999-9999-99999999999a/pdf', NULL),
    ('99999999-9999-9999-9999-99999999999b', '550e8400-e29b-41d4-a716-446655440000', 'education', '75/уч', 'О переводе на следующий курс', '2025-07-15', '{"comment": "№75/уч от 15.07.2025", "fromCourse": "3", "toCourse": "4"}', '/orders/99999999-9999-9999-9999-99999999999b/pdf', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert order notifications
INSERT INTO order_notification (id, order_id, severity, message, action)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'info', 'Стипендия будет начислена 15 числа', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '99999999-9999-9999-9999-99999999999a', 'warning', 'Необходимо подписать договор в течение 7 дней', '/dormitory/sign-contract')
ON CONFLICT (id) DO NOTHING;
