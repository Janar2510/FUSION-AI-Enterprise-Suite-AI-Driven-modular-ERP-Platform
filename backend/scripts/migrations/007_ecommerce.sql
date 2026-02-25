-- Migration for eCommerce Module (Odoo 19.0 Parity)
-- Creates WebCart, WebCartItem, WebOrder, and CustomerReview tables

BEGIN;

CREATE TABLE IF NOT EXISTS web_carts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES crm_contacts(id) ON DELETE SET NULL,
    subtotal DOUBLE PRECISION DEFAULT 0.0,
    tax_amount DOUBLE PRECISION DEFAULT 0.0,
    discount_amount DOUBLE PRECISION DEFAULT 0.0,
    total_amount DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_web_carts_session_id ON web_carts(session_id);

CREATE TABLE IF NOT EXISTS web_cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES web_carts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name VARCHAR,
    product_sku VARCHAR,
    quantity DOUBLE PRECISION DEFAULT 1.0,
    unit_price DOUBLE PRECISION DEFAULT 0.0,
    line_total DOUBLE PRECISION DEFAULT 0.0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS web_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR UNIQUE NOT NULL,
    sale_order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
    cart_id INTEGER REFERENCES web_carts(id) ON DELETE SET NULL,
    browser_ip VARCHAR,
    user_agent VARCHAR,
    transaction_id VARCHAR,
    gateway_status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_web_orders_number ON web_orders(order_number);

CREATE TABLE IF NOT EXISTS web_customer_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    customer_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
    rating INTEGER DEFAULT 5,
    title VARCHAR,
    content TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_web_reviews_product ON web_customer_reviews(product_id);

COMMIT;
