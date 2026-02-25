-- Migration for POS Loyalty Module (Odoo 19.0 Parity)
-- Creates pos_loyalty_programs, pos_loyalty_rewards, pos_loyalty_cards

BEGIN;

CREATE TABLE IF NOT EXISTS pos_loyalty_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    points_per_dollar DOUBLE PRECISION DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_loyalty_rewards (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES pos_loyalty_programs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    points_cost DOUBLE PRECISION NOT NULL,
    discount_amount DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pos_loyalty_cards (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES pos_loyalty_programs(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
    points DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer ON pos_loyalty_cards(customer_id);

-- Insert a default mock loyalty program and reward
INSERT INTO pos_loyalty_programs (name, points_per_dollar, is_active)
VALUES ('Gold Members', 1.5, true)
ON CONFLICT DO NOTHING;

INSERT INTO pos_loyalty_rewards (program_id, name, points_cost, discount_amount, is_active)
VALUES (1, '$10 Off Coupon', 500, 10.0, true)
ON CONFLICT DO NOTHING;

COMMIT;
