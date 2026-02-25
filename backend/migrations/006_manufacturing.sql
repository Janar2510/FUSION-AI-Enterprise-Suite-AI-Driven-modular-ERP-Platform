-- Manufacturing Module Migrations (Odoo Parity)
-- Adds Master Production Schedule, Subcontracting Orders, and BOM Byproducts

CREATE TYPE mps_status AS ENUM ('draft', 'confirmed');

-- Master Production Schedule
CREATE TABLE IF NOT EXISTS mrp_mps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    period VARCHAR(20) DEFAULT 'month',
    date_start TIMESTAMP WITH TIME ZONE NOT NULL,
    date_stop TIMESTAMP WITH TIME ZONE NOT NULL,
    forecasted_demand INTEGER DEFAULT 0,
    forecasted_inventory INTEGER DEFAULT 0,
    replenish_quantity INTEGER DEFAULT 0,
    status mps_status DEFAULT 'draft'
);

CREATE INDEX idx_mrp_mps_product_id ON mrp_mps(product_id);
CREATE INDEX idx_mrp_mps_date_start ON mrp_mps(date_start);

-- Subcontracting Orders
CREATE TABLE IF NOT EXISTS subcontracting_orders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    subcontractor_id INTEGER NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    bom_id INTEGER REFERENCES bills_of_material(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    purchase_order_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subcontracting_orders_subcontractor_id ON subcontracting_orders(subcontractor_id);
CREATE INDEX idx_subcontracting_orders_product_id ON subcontracting_orders(product_id);

-- BOM Byproducts
CREATE TABLE IF NOT EXISTS bom_byproducts (
    id SERIAL PRIMARY KEY,
    bom_id INTEGER REFERENCES bills_of_material(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 4) NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'pcs',
    cost_share FLOAT DEFAULT 0.0
);

CREATE INDEX idx_bom_byproducts_bom_id ON bom_byproducts(bom_id);
CREATE INDEX idx_bom_byproducts_product_id ON bom_byproducts(product_id);

-- Altering Production Status Enum to include new statuses
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'productionstatus') THEN
        BEGIN
            ALTER TYPE productionstatus ADD VALUE 'draft';
        EXCEPTION WHEN duplicate_object THEN null; END;

        BEGIN
            ALTER TYPE productionstatus ADD VALUE 'confirmed';
        EXCEPTION WHEN duplicate_object THEN null; END;

        BEGIN
            ALTER TYPE productionstatus ADD VALUE 'to_close';
        EXCEPTION WHEN duplicate_object THEN null; END;

        BEGIN
            ALTER TYPE productionstatus ADD VALUE 'done';
        EXCEPTION WHEN duplicate_object THEN null; END;
    END IF;
END
$$;
