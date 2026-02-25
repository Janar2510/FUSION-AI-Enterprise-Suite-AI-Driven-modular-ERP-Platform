-- Inventory Module Migrations (Odoo Parity)
-- Adds hierarchical locations, rules, lot/serial numbers, and landed costs

CREATE TYPE location_type AS ENUM ('supplier', 'view', 'internal', 'customer', 'inventory', 'production', 'transit');
CREATE TYPE rule_action AS ENUM ('pull', 'push', 'pull_push', 'buy', 'manufacture');

-- Warehouse Locations (Existing but might need updates, assuming base fields are covered)
-- ALTER TABLE warehouse_locations ...

-- Stock Locations constraints
CREATE TABLE IF NOT EXISTS stock_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    complete_name VARCHAR(255) NOT NULL,
    location_type location_type DEFAULT 'internal',
    parent_id INTEGER REFERENCES stock_locations(id) ON DELETE SET NULL,
    warehouse_id INTEGER REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    is_scrap BOOLEAN DEFAULT FALSE,
    is_return BOOLEAN DEFAULT FALSE,
    barcode VARCHAR(255) UNIQUE,
    max_weight FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_locations_name ON stock_locations(name);
CREATE INDEX idx_stock_locations_complete_name ON stock_locations(complete_name);
CREATE INDEX idx_stock_locations_parent_id ON stock_locations(parent_id);
CREATE INDEX idx_stock_locations_warehouse_id ON stock_locations(warehouse_id);

-- Stock Rules
CREATE TABLE IF NOT EXISTS stock_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    action rule_action NOT NULL,
    source_location_id INTEGER REFERENCES stock_locations(id) ON DELETE SET NULL,
    destination_location_id INTEGER REFERENCES stock_locations(id) ON DELETE SET NULL,
    delay INTEGER DEFAULT 0
);

CREATE INDEX idx_stock_rules_name ON stock_rules(name);

-- Lot / Serial Numbers
CREATE TABLE IF NOT EXISTS lot_serial_numbers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    removal_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lot_serial_numbers_name ON lot_serial_numbers(name);
CREATE INDEX idx_lot_serial_numbers_product_id ON lot_serial_numbers(product_id);

-- Landed Costs
CREATE TABLE IF NOT EXISTS landed_costs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cost_amount NUMERIC(10, 2) NOT NULL,
    split_method VARCHAR(50) NOT NULL,
    receipt_reference VARCHAR(255),
    notes TEXT
);

CREATE INDEX idx_landed_costs_name ON landed_costs(name);

-- Altering existing tables to link to the new advanced concepts
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS costing_method VARCHAR(50) DEFAULT 'standard';
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS putaway_strategy_id INTEGER REFERENCES stock_locations(id) ON DELETE SET NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS tracking VARCHAR(50) DEFAULT 'none';

ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS source_location_id INTEGER REFERENCES stock_locations(id) ON DELETE SET NULL;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS dest_location_id INTEGER REFERENCES stock_locations(id) ON DELETE SET NULL;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS lot_id INTEGER REFERENCES lot_serial_numbers(id) ON DELETE SET NULL;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS rule_id INTEGER REFERENCES stock_rules(id) ON DELETE SET NULL;

-- Altering Enums (StockMovementType) to include PRODUCTION if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
        -- Type doesn't exist, create it (assuming it was created in a previous migration though)
        CREATE TYPE stock_movement_type AS ENUM ('inbound', 'outbound', 'transfer', 'adjustment', 'return', 'damage', 'loss', 'production');
    ELSE
        -- Attempt to add the new value if possible (Postgres 9.1+)
        BEGIN
            ALTER TYPE stock_movement_type ADD VALUE 'production';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END
$$;
