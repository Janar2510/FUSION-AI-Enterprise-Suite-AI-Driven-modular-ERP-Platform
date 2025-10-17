-- Core Accounting Tables
CREATE TABLE chart_of_accounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    parent_id INTEGER REFERENCES chart_of_accounts(id),
    company_id INTEGER NOT NULL,
    currency_id INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fiscal_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    company_id INTEGER NOT NULL,
    state VARCHAR(20) DEFAULT 'open', -- open, closed
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    reference VARCHAR(255),
    state VARCHAR(20) DEFAULT 'draft', -- draft, posted, cancelled
    company_id INTEGER NOT NULL,
    fiscal_year_id INTEGER REFERENCES fiscal_years(id),
    created_by INTEGER NOT NULL,
    posted_by INTEGER,
    posted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES chart_of_accounts(id),
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    partner_id INTEGER,
    tax_id INTEGER,
    analytic_account_id INTEGER,
    reconciled BOOLEAN DEFAULT false,
    reconciliation_id INTEGER
);

CREATE TABLE taxes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- percent, fixed, group
    amount DECIMAL(5,2),
    account_id INTEGER REFERENCES chart_of_accounts(id),
    company_id INTEGER NOT NULL,
    active BOOLEAN DEFAULT true
);

CREATE TABLE bank_statements (
    id SERIAL PRIMARY KEY,
    bank_account_id INTEGER NOT NULL,
    statement_number VARCHAR(100),
    start_date DATE,
    end_date DATE,
    balance_start DECIMAL(15,2),
    balance_end DECIMAL(15,2),
    state VARCHAR(20) DEFAULT 'draft' -- draft, confirmed, reconciled
);

CREATE TABLE payment_terms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    days INTEGER,
    type VARCHAR(50), -- net, percent, fixed
    value DECIMAL(5,2)
);

-- Create indexes for performance
CREATE INDEX idx_chart_of_accounts_code ON chart_of_accounts(code);
CREATE INDEX idx_chart_of_accounts_type ON chart_of_accounts(type);
CREATE INDEX idx_fiscal_years_company ON fiscal_years(company_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(date);
CREATE INDEX idx_journal_entries_state ON journal_entries(state);
CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_taxes_company ON taxes(company_id);