-- Invoicing Module Database Schema

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    billing_address TEXT,
    shipping_address TEXT,
    tax_id VARCHAR(50),
    payment_terms_id INTEGER REFERENCES payment_terms(id),
    currency_id INTEGER,
    credit_limit DECIMAL(15,2),
    outstanding_balance DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    unit_price DECIMAL(15,2),
    cost DECIMAL(15,2),
    tax_id INTEGER REFERENCES taxes(id),
    category VARCHAR(100),
    inventory_item BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice headers table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency_id INTEGER,
    payment_terms_id INTEGER REFERENCES payment_terms(id),
    notes TEXT,
    terms TEXT,
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice lines table
CREATE TABLE invoice_lines (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(15,2),
    tax_id INTEGER REFERENCES taxes(id),
    tax_amount DECIMAL(15,2) DEFAULT 0,
    line_total DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2),
    payment_method VARCHAR(50), -- cash, check, credit_card, bank_transfer
    reference VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, refunded
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit notes table
CREATE TABLE credit_notes (
    id SERIAL PRIMARY KEY,
    credit_note_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INTEGER REFERENCES invoices(id),
    customer_id INTEGER REFERENCES customers(id),
    credit_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, issued, applied
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    issued_at TIMESTAMP,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit note lines table
CREATE TABLE credit_note_lines (
    id SERIAL PRIMARY KEY,
    credit_note_id INTEGER REFERENCES credit_notes(id) ON DELETE CASCADE,
    invoice_line_id INTEGER REFERENCES invoice_lines(id),
    description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(15,2),
    tax_id INTEGER REFERENCES taxes(id),
    tax_amount DECIMAL(15,2) DEFAULT 0,
    line_total DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recurring invoice templates table
CREATE TABLE recurring_invoice_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    frequency VARCHAR(20), -- daily, weekly, monthly, yearly
    start_date DATE,
    end_date DATE,
    next_invoice_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency_id INTEGER,
    payment_terms_id INTEGER REFERENCES payment_terms(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recurring invoice template lines table
CREATE TABLE recurring_template_lines (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES recurring_invoice_templates(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(15,2),
    tax_id INTEGER REFERENCES taxes(id),
    tax_amount DECIMAL(15,2) DEFAULT 0,
    line_total DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_credit_notes_invoice ON credit_notes(invoice_id);
CREATE INDEX idx_credit_notes_status ON credit_notes(status);
CREATE INDEX idx_recurring_templates_customer ON recurring_invoice_templates(customer_id);
CREATE INDEX idx_recurring_templates_status ON recurring_invoice_templates(status);
CREATE INDEX idx_recurring_template_lines_template ON recurring_template_lines(template_id);