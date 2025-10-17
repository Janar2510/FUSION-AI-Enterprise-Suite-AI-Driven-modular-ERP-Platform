-- Create contact_activities table for universal tracking
CREATE TABLE IF NOT EXISTS contact_activities (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER,
    company_id INTEGER,
    user_id INTEGER,
    
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_activities TO fusionai_user;




