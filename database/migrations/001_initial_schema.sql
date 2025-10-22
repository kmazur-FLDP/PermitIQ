-- PermitIQ Database Schema - Initial Migration
-- PostgreSQL + PostGIS for Southwest Florida Water Management District ERP Data
-- Version: 1.0.0
-- Created: 2025-10-22

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable PostGIS for spatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: erp_permits
-- Main table for Environmental Resource Permit data from SWFWMD
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_permits (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    permit_number VARCHAR(50) UNIQUE NOT NULL,  -- Official SWFWMD permit number
    objectid INTEGER UNIQUE,  -- SWFWMD's internal object ID
    
    -- Applicant information
    applicant_name VARCHAR(500),
    company_name VARCHAR(500),
    
    -- Permit details
    permit_type VARCHAR(100),
    permit_status VARCHAR(50),
    activity_description TEXT,
    
    -- Dates
    application_date DATE,
    issue_date DATE,
    expiration_date DATE,
    last_modified_date TIMESTAMP WITH TIME ZONE,
    
    -- Location information
    county VARCHAR(100),
    city VARCHAR(200),
    address TEXT,
    
    -- Spatial data (PostGIS geometry)
    -- Spatial (store both polygon boundary and centroid for performance)
    geometry GEOMETRY(Polygon, 4326),  -- Full project boundary from SWFWMD
    location GEOMETRY(Point, 4326),    -- Centroid for quick lookups and markers
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Project details
    project_name VARCHAR(500),
    project_type VARCHAR(200),
    acreage DECIMAL(10, 2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(100) DEFAULT 'SWFWMD_API',
    
    -- Full API response (for future reference/debugging)
    raw_data JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_erp_permits_permit_number ON erp_permits(permit_number);
CREATE INDEX IF NOT EXISTS idx_erp_permits_applicant_name ON erp_permits(applicant_name);
CREATE INDEX IF NOT EXISTS idx_erp_permits_company_name ON erp_permits(company_name);
CREATE INDEX IF NOT EXISTS idx_erp_permits_county ON erp_permits(county);
CREATE INDEX IF NOT EXISTS idx_erp_permits_permit_status ON erp_permits(permit_status);
CREATE INDEX IF NOT EXISTS idx_erp_permits_issue_date ON erp_permits(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_erp_permits_updated_at ON erp_permits(updated_at DESC);

-- Spatial index for geographic queries
CREATE INDEX IF NOT EXISTS idx_erp_permits_geometry ON erp_permits USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_erp_permits_location ON erp_permits USING GIST(location);

-- Full-text search index for applicant/company names
CREATE INDEX IF NOT EXISTS idx_erp_permits_search ON erp_permits 
    USING GIN(to_tsvector('english', 
        COALESCE(applicant_name, '') || ' ' || 
        COALESCE(company_name, '') || ' ' || 
        COALESCE(project_name, '')
    ));

-- ============================================================================
-- TABLE: erp_permit_changes
-- Track changes to permit records over time for competitive intelligence
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_permit_changes (
    id BIGSERIAL PRIMARY KEY,
    permit_id BIGINT REFERENCES erp_permits(id) ON DELETE CASCADE,
    permit_number VARCHAR(50) NOT NULL,
    
    -- Change tracking
    change_type VARCHAR(20) NOT NULL,  -- 'created', 'updated', 'deleted'
    change_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- What changed
    changed_fields JSONB,  -- Array of field names that changed
    old_values JSONB,      -- Previous values
    new_values JSONB,      -- New values
    
    -- Full snapshot of permit data at time of change
    permit_snapshot JSONB,
    
    -- Metadata
    etl_run_id UUID,  -- Link to specific ETL execution
    notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_erp_changes_permit_id ON erp_permit_changes(permit_id);
CREATE INDEX IF NOT EXISTS idx_erp_changes_permit_number ON erp_permit_changes(permit_number);
CREATE INDEX IF NOT EXISTS idx_erp_changes_detected_at ON erp_permit_changes(change_detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_changes_type ON erp_permit_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_erp_changes_etl_run ON erp_permit_changes(etl_run_id);

-- ============================================================================
-- TABLE: erp_statistics
-- Daily aggregated metrics for trend analysis and hotspot detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_statistics (
    id BIGSERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    
    -- Geographic grouping
    county VARCHAR(100),
    city VARCHAR(200),
    
    -- Aggregated metrics
    total_permits INTEGER DEFAULT 0,
    new_permits INTEGER DEFAULT 0,
    modified_permits INTEGER DEFAULT 0,
    active_permits INTEGER DEFAULT 0,
    expired_permits INTEGER DEFAULT 0,
    
    -- Activity indicators
    total_acreage DECIMAL(12, 2),
    avg_acreage DECIMAL(10, 2),
    
    -- Trend data (for hotspot algorithm)
    permits_vs_30day_avg DECIMAL(5, 2),  -- Percentage vs 30-day average
    permits_vs_90day_avg DECIMAL(5, 2),  -- Percentage vs 90-day average
    growth_rate DECIMAL(5, 2),           -- Month-over-month growth
    
    -- Hotspot score (0-10 scale)
    hotspot_score DECIMAL(3, 1) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per date/location combination
    UNIQUE(stat_date, county, city)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_erp_stats_date ON erp_statistics(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_erp_stats_county ON erp_statistics(county);
CREATE INDEX IF NOT EXISTS idx_erp_stats_hotspot ON erp_statistics(hotspot_score DESC);

-- ============================================================================
-- TABLE: user_profiles
-- Extended user information (linked to Supabase auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User information
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    
    -- Preferences
    default_county VARCHAR(100),
    notification_preferences JSONB DEFAULT '{"email": true, "hotspots": true}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ============================================================================
-- TABLE: user_bookmarks
-- User-saved permits for tracking competitors or projects of interest
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    permit_id BIGINT REFERENCES erp_permits(id) ON DELETE CASCADE,
    
    -- Bookmark details
    notes TEXT,
    tags VARCHAR(50)[],  -- Array of user-defined tags
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate bookmarks
    UNIQUE(user_id, permit_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_permit_id ON user_bookmarks(permit_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_tags ON user_bookmarks USING GIN(tags);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on user-specific tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can only manage their own bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can view own bookmarks" ON user_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON user_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can update own bookmarks" ON user_bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON user_bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_erp_permits_updated_at ON erp_permits;
CREATE TRIGGER update_erp_permits_updated_at
    BEFORE UPDATE ON erp_permits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_bookmarks_updated_at ON user_bookmarks;
CREATE TRIGGER update_user_bookmarks_updated_at
    BEFORE UPDATE ON user_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Recent permit activity (last 30 days)
CREATE OR REPLACE VIEW recent_permit_activity AS
SELECT 
    p.*,
    CASE 
        WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN 'new'
        WHEN p.updated_at >= NOW() - INTERVAL '30 days' THEN 'updated'
        ELSE 'stable'
    END AS activity_status
FROM erp_permits p
WHERE p.created_at >= NOW() - INTERVAL '30 days'
   OR p.updated_at >= NOW() - INTERVAL '30 days'
ORDER BY p.updated_at DESC;

-- View: Active hotspots
CREATE OR REPLACE VIEW active_hotspots AS
SELECT *
FROM erp_statistics
WHERE hotspot_score >= 5.0
  AND stat_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY hotspot_score DESC, stat_date DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE erp_permits IS 'Environmental Resource Permits from SWFWMD - main permit data';
COMMENT ON TABLE erp_permit_changes IS 'Change history for competitive intelligence tracking';
COMMENT ON TABLE erp_statistics IS 'Daily aggregated metrics for trend analysis and hotspot detection';
COMMENT ON TABLE user_profiles IS 'User accounts and preferences (linked to Supabase auth)';
COMMENT ON TABLE user_bookmarks IS 'User-saved permits for tracking';

COMMENT ON COLUMN erp_permits.geometry IS 'PostGIS point geometry (WGS84/EPSG:4326)';
COMMENT ON COLUMN erp_permits.raw_data IS 'Complete JSON response from SWFWMD API';
COMMENT ON COLUMN erp_statistics.hotspot_score IS 'Calculated score 0-10 for unusual permit activity';
