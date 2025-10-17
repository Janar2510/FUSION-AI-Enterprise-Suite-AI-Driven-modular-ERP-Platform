-- Contact Hub Database Migration
-- Universal contact tracking across all modules with enhanced capabilities

-- Create contacts table for unified contact management
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE, -- For external system references
    type VARCHAR(50) NOT NULL, -- person, company, vendor, customer, employee
    
    -- Basic information
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Person fields
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    title VARCHAR(100),
    
    -- Company fields  
    company_name VARCHAR(255),
    tax_id VARCHAR(50),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2),
    
    -- Metadata
    tags TEXT[], -- Array of tags
    custom_fields JSONB DEFAULT '{}',
    
    -- Scoring and status
    engagement_score DECIMAL(5,2) DEFAULT 0,
    lifecycle_stage VARCHAR(50), -- lead, customer, partner, etc
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP,
    
    -- Audit columns (created_by, updated_by)
    created_by UUID,
    updated_by UUID,
    
    -- Search
    search_vector tsvector
);

-- Create companies table for company management
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    website VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    industry VARCHAR(100),
    company_type VARCHAR(50), -- B2B, B2C, Non-profit, etc.
    employee_count INTEGER,
    annual_revenue DECIMAL(15,2),
    description TEXT,
    founded_year INTEGER,
    headquarters VARCHAR(255),
    logo_url VARCHAR(500),
    social_profiles JSONB,
    technologies_used JSONB,
    keywords JSONB,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    account_status VARCHAR(50), -- prospect, customer, churned
    customer_since TIMESTAMP,
    health_score DECIMAL(5,2), -- 0-100, AI-calculated
    churn_risk DECIMAL(5,2), -- 0-100, AI-predicted
    expansion_potential DECIMAL(5,2), -- 0-100, AI-predicted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit columns (created_by, updated_by)
    created_by UUID,
    updated_by UUID
);

-- Create app_profiles table for app-specific data
CREATE TABLE IF NOT EXISTS app_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    app_name VARCHAR(50) NOT NULL,
    profile_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit columns (created_by, updated_by)
    created_by UUID,
    updated_by UUID,
    UNIQUE(contact_id, app_name)
);

-- Create activities table for unified activity stream
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    app_name VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    metadata JSONB,
    importance VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    sentiment_score DECIMAL(3,2), -- -1 to 1
    engagement_score DECIMAL(5,2), -- 0 to 100
    intent_signals JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    
    -- Audit columns
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Create relationships table for contact relationships
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    target_contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50), -- parent, subsidiary, employer, spouse, etc
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit columns (created_by, updated_by)
    created_by UUID,
    updated_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_company ON activities(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_app ON activities(app_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_contact_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_contact_id);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_contact_search() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.full_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.company_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to update search vector
CREATE TRIGGER update_contact_search_trigger
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_contact_search();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO fusionai_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO fusionai_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_profiles TO fusionai_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO fusionai_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON relationships TO fusionai_user;