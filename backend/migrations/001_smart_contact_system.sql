-- Smart Contact System Database Migration
-- Universal contact tracking across all modules

-- Create contact_activities table for universal tracking
CREATE TABLE IF NOT EXISTS contact_activities (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES crm_companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Activity Details
    activity_type VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    
    -- Activity Data
    title VARCHAR(255),
    description TEXT,
    metadata JSONB,
    
    -- AI Analysis
    sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    engagement_score FLOAT CHECK (engagement_score >= 0 AND engagement_score <= 100),
    intent_signals JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_contact ON contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_company ON contact_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_module ON contact_activities(module);
CREATE INDEX IF NOT EXISTS idx_activities_created ON contact_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON contact_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON contact_activities(entity_type, entity_id);

-- Add cross-module tracking columns to existing tables
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS module_interactions JSONB DEFAULT '{}';
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS cross_module_score INTEGER DEFAULT 0;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS unified_timeline JSONB DEFAULT '[]';
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS last_cross_module_activity TIMESTAMP;

-- Create materialized view for real-time insights
CREATE MATERIALIZED VIEW IF NOT EXISTS contact_insights AS
SELECT 
    c.id,
    c.email,
    c.first_name,
    c.last_name,
    COUNT(DISTINCT ca.module) as modules_used,
    COUNT(ca.id) as total_interactions,
    AVG(ca.engagement_score) as avg_engagement,
    MAX(ca.created_at) as last_activity,
    SUM(CASE WHEN ca.activity_type LIKE '%purchase%' OR ca.activity_type LIKE '%deal_won%' THEN 1 ELSE 0 END) as purchase_signals,
    SUM(CASE WHEN ca.sentiment_score < -0.5 THEN 1 ELSE 0 END) as negative_sentiment_count,
    SUM(CASE WHEN ca.engagement_score > 80 THEN 1 ELSE 0 END) as high_engagement_count,
    ARRAY_AGG(DISTINCT ca.module) as active_modules
FROM crm_contacts c
LEFT JOIN contact_activities ca ON c.id = ca.contact_id
GROUP BY c.id, c.email, c.first_name, c.last_name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_insights_id ON contact_insights(id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_contact_insights()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY contact_insights;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update contact insights when activities change
CREATE OR REPLACE FUNCTION update_contact_insights()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh the materialized view
    PERFORM refresh_contact_insights();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_contact_insights ON contact_activities;
CREATE TRIGGER trigger_update_contact_insights
    AFTER INSERT OR UPDATE OR DELETE ON contact_activities
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_contact_insights();

-- Create function to get contact timeline
CREATE OR REPLACE FUNCTION get_contact_timeline(contact_id_param INTEGER)
RETURNS TABLE (
    id INTEGER,
    activity_type VARCHAR(50),
    module VARCHAR(50),
    entity_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    metadata JSONB,
    sentiment_score FLOAT,
    engagement_score FLOAT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.activity_type,
        ca.module,
        ca.entity_type,
        ca.title,
        ca.description,
        ca.metadata,
        ca.sentiment_score,
        ca.engagement_score,
        ca.created_at
    FROM contact_activities ca
    WHERE ca.contact_id = contact_id_param
    ORDER BY ca.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cross-module insights
CREATE OR REPLACE FUNCTION get_cross_module_insights(contact_id_param INTEGER)
RETURNS TABLE (
    total_interactions BIGINT,
    modules_used TEXT[],
    last_activity TIMESTAMP,
    avg_engagement FLOAT,
    purchase_signals BIGINT,
    negative_sentiment_count BIGINT,
    high_engagement_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.total_interactions,
        ci.active_modules,
        ci.last_activity,
        ci.avg_engagement,
        ci.purchase_signals,
        ci.negative_sentiment_count,
        ci.high_engagement_count
    FROM contact_insights ci
    WHERE ci.id = contact_id_param;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO contact_activities (contact_id, activity_type, module, entity_type, title, description, engagement_score, created_at)
SELECT 
    c.id,
    'contact_created',
    'crm',
    'contact',
    'Contact Created',
    'New contact added to CRM',
    50.0,
    c.created_at
FROM crm_contacts c
WHERE NOT EXISTS (SELECT 1 FROM contact_activities WHERE contact_id = c.id);

-- Update contact insights
SELECT refresh_contact_insights();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_activities TO fusionai_user;
GRANT SELECT ON contact_insights TO fusionai_user;
GRANT EXECUTE ON FUNCTION get_contact_timeline(INTEGER) TO fusionai_user;
GRANT EXECUTE ON FUNCTION get_cross_module_insights(INTEGER) TO fusionai_user;
GRANT EXECUTE ON FUNCTION refresh_contact_insights() TO fusionai_user;




