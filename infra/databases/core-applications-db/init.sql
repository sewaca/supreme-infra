-- Initial schema for core-applications database
-- This script is executed automatically when PostgreSQL starts for the first time

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS user_application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    application_type VARCHAR NOT NULL,
    application_number VARCHAR NOT NULL,
    additional_fields JSONB,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notifications_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_application_user_id ON user_application(user_id);
CREATE INDEX IF NOT EXISTS idx_user_application_type ON user_application(application_type);

CREATE TABLE IF NOT EXISTS application_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES user_application(id) ON DELETE CASCADE,
    severity VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    action VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_notification_application_id ON application_notification(application_id);

CREATE TABLE IF NOT EXISTS reference_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reference_type VARCHAR NOT NULL,
    type_label VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'preparation',
    order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    pickup_point_id VARCHAR,
    virtual_only BOOLEAN NOT NULL DEFAULT FALSE,
    storage_until TIMESTAMP WITH TIME ZONE,
    pdf_url VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_reference_order_user_id ON reference_order(user_id);

CREATE TABLE IF NOT EXISTS "order" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR NOT NULL,
    number VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    date DATE NOT NULL,
    additional_fields JSONB,
    pdf_url VARCHAR,
    actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_user_id ON "order"(user_id);
CREATE INDEX IF NOT EXISTS idx_order_type ON "order"(type);

CREATE TABLE IF NOT EXISTS order_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    severity VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    action VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_notification_order_id ON order_notification(order_id);

-- Insert test data for user_id: 550e8400-e29b-41d4-a716-446655440000

INSERT INTO user_application (id, user_id, application_type, application_number, additional_fields, start_date, end_date, is_active, notifications_count) VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', 'СТ-2025-001', '{"amount": 5000.00, "currency": "RUB"}', '2025-09-01 00:00:00+00', '2026-06-30 00:00:00+00', TRUE, 1), ('dddddddd-dddd-dddd-dddd-ddddddddddde', '550e8400-e29b-41d4-a716-446655440000', 'dormitory', 'ОБ-2022-042', '{"contractNumber": "ОБ-2022-042", "dormitoryName": "Общежитие №3", "address": "ул. Примерная, д. 10", "roomNumber": "305"}', '2022-09-01 00:00:00+00', '2026-06-30 00:00:00+00', TRUE, 2);

INSERT INTO application_notification (id, application_id, severity, message, action) VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'info', 'Стипендия будет начислена 15 числа', NULL), ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'warning', 'Необходимо оплатить проживание до 25 числа', '/dormitory/payment'), ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef0', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'error', 'Требуется подписать дополнительное соглашение', '/dormitory/sign-agreement');

INSERT INTO reference_order (id, user_id, reference_type, type_label, status, order_date, pickup_point_id, virtual_only, storage_until, pdf_url) VALUES ('88888888-8888-8888-8888-888888888888', '550e8400-e29b-41d4-a716-446655440000', 'rdzd', 'РЖД', 'ready', '2025-01-28 00:00:00+00', 'spbkt_hr', FALSE, '2025-02-14 00:00:00+00', '/references/88888888-8888-8888-8888-888888888888/pdf'), ('88888888-8888-8888-8888-888888888889', '550e8400-e29b-41d4-a716-446655440000', 'study_confirmation', 'Справка об обучении', 'preparation', '2026-03-09 00:00:00+00', 'spbkt_hr', FALSE, NULL, NULL);

INSERT INTO "order" (id, user_id, type, number, title, date, additional_fields, pdf_url, actions) VALUES ('99999999-9999-9999-9999-999999999999', '550e8400-e29b-41d4-a716-446655440000', 'scholarship', '250/кс', 'Назначить стипендию', '2026-02-18', '{"comment": "№250/кс от 18.02.2026", "startDate": "2026-02-01", "endDate": "2026-04-30"}', '/orders/99999999-9999-9999-9999-999999999999/pdf', '{"primary": {"title": "Скачать PDF", "action": "/orders/99999999-9999-9999-9999-999999999999/pdf"}}'), ('99999999-9999-9999-9999-99999999999a', '550e8400-e29b-41d4-a716-446655440000', 'dormitory', '150/об', 'О заселении в общежитие', '2025-09-01', '{"comment": "№150/об от 01.09.2025", "dormitoryAddress": "ул. Примерная, д. 10", "roomNumber": "305"}', '/orders/99999999-9999-9999-9999-99999999999a/pdf', NULL), ('99999999-9999-9999-9999-99999999999b', '550e8400-e29b-41d4-a716-446655440000', 'education', '75/уч', 'О переводе на следующий курс', '2025-07-15', '{"comment": "№75/уч от 15.07.2025", "fromCourse": "3", "toCourse": "4"}', '/orders/99999999-9999-9999-9999-99999999999b/pdf', NULL);

INSERT INTO order_notification (id, order_id, severity, message, action) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'info', 'Стипендия будет начислена 15 числа', NULL), ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '99999999-9999-9999-9999-99999999999a', 'warning', 'Необходимо подписать договор в течение 7 дней', '/dormitory/sign-contract');
