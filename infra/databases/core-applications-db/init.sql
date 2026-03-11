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
