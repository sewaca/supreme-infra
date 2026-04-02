-- Migration: Add test teacher user (Коробов С.А.)
-- UUID matches core-auth + core-client-info: d0000000-0000-0000-0000-000000000001
-- Teachers have no scholarship/dormitory applications.
-- Added: reference_order (workplace) + employment orders.

-- ─── reference_order ────────────────────────────────────────────────────────────

INSERT INTO reference_order (id, user_id, reference_type, type_label, status, order_date, pickup_point_id, virtual_only, storage_until, pdf_url)
VALUES
    (
        'd8000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000001',
        'workplace',
        'По месту работы',
        'ready',
        '2025-09-01 00:00:00+00',
        'spbgt_hr',
        FALSE,
        '2025-10-01 00:00:00+00',
        '/references/d8000000-0000-0000-0000-000000000001/pdf'
    )
ON CONFLICT (id) DO NOTHING;

-- ─── order ──────────────────────────────────────────────────────────────────────

INSERT INTO "order" (id, user_id, type, number, title, date, additional_fields, pdf_url, actions)
VALUES
    (
        'd9000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000001',
        'general',
        '15/пр',
        'О приёме на работу',
        '2010-09-01',
        '{"comment": "№15/пр от 01.09.2010", "position": "Доцент кафедры ИТПИ"}',
        '/orders/d9000000-0000-0000-0000-000000000001/pdf',
        NULL
    ),
    (
        'd9000000-0000-0000-0000-000000000002',
        'd0000000-0000-0000-0000-000000000001',
        'general',
        '42/пр',
        'О нагрузке на учебный год',
        '2025-09-01',
        '{"comment": "№42/пр от 01.09.2025", "academicYear": "2025/2026"}',
        '/orders/d9000000-0000-0000-0000-000000000002/pdf',
        NULL
    )
ON CONFLICT (id) DO NOTHING;
