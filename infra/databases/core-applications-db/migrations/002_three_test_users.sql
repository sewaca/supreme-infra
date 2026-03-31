-- Migration: Заявки для тестовых студентов f1000000-0000-0000-0000-000000000001..003
-- (аналогично Ивану — чтобы при логине были данные в разделе заявок)

INSERT INTO user_application (id, user_id, application_type, application_number, additional_fields, start_date, end_date, is_active, notifications_count)
VALUES
    (
        'fddddddd-dddd-dddd-dddd-dddddddd0001',
        'f1000000-0000-0000-0000-000000000001',
        'scholarship',
        '255/кс',
        '{"amount": 4500.00, "currency": "RUB", "order_id": "f9999999-9999-9999-9999-999999999901"}',
        '2025-09-01 00:00:00+00',
        '2026-06-30 00:00:00+00',
        TRUE,
        1
    ),
    (
        'fddddddd-dddd-dddd-dddd-dddddddd0002',
        'f1000000-0000-0000-0000-000000000002',
        'dormitory',
        '10601ЖК24102',
        '{"contractNumber": "10601ЖК24102", "dormitoryName": "Рыбацкое", "address": "Санкт-Петербург, ул. Караваевская, 34", "roomNumber": "12а (4)"}',
        '2024-09-01 00:00:00+00',
        '2026-06-30 00:00:00+00',
        TRUE,
        0
    ),
    (
        'fddddddd-dddd-dddd-dddd-dddddddd0003',
        'f1000000-0000-0000-0000-000000000003',
        'scholarship',
        '290/кс',
        '{"amount": 7500.00, "currency": "RUB", "order_id": "f9999999-9999-9999-9999-999999999903"}',
        '2025-09-01 00:00:00+00',
        '2026-06-30 00:00:00+00',
        TRUE,
        2
    )
ON CONFLICT (id) DO UPDATE SET
    application_number = EXCLUDED.application_number,
    additional_fields = EXCLUDED.additional_fields;

INSERT INTO application_notification (id, application_id, severity, message, action)
VALUES
    ('feeeeeee-eeee-eeee-eeee-eeeeeeee0001', 'fddddddd-dddd-dddd-dddd-dddddddd0001', 'info', 'Заявка на стипендию принята к рассмотрению', NULL),
    ('feeeeeee-eeee-eeee-eeee-eeeeeeee0003', 'fddddddd-dddd-dddd-dddd-dddddddd0003', 'success', 'Назначена повышенная академическая стипендия', NULL),
    ('feeeeeee-eeee-eeee-eeee-eeeeeeee0004', 'fddddddd-dddd-dddd-dddd-dddddddd0003', 'info', 'Перечисление ожидается до 20 числа', NULL)
ON CONFLICT (id) DO NOTHING;
