-- PermitIQ Database Schema - Migration 005
-- Add competitor watchlist tracking
-- Version: 1.0.0
-- Created: 2025-10-22

-- ============================================================================
-- TABLE: competitor_watchlist
-- Purpose: Track specific applicants/companies of interest for competitive intelligence
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_watchlist (
    id BIGSERIAL PRIMARY KEY,
    
    -- Competitor identification
    company_name TEXT NOT NULL UNIQUE,
    company_aliases TEXT[], -- Alternative names/spellings for matching
    
    -- Classification
    competitor_type TEXT CHECK (competitor_type IN ('direct', 'indirect', 'partner', 'other')),
    industry_segment TEXT,
    
    -- Contact information
    primary_contact TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    
    -- Tracking settings
    alert_enabled BOOLEAN DEFAULT true,
    alert_radius_miles NUMERIC(8, 2), -- Alert if permit within X miles of our projects
    priority_level TEXT CHECK (priority_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    
    -- Notes and tags
    notes TEXT,
    tags TEXT[],
    
    -- Metadata
    added_by TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Statistics (updated via triggers)
    total_permits INTEGER DEFAULT 0,
    active_permits INTEGER DEFAULT 0,
    last_permit_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_competitor_watchlist_company_name ON competitor_watchlist(company_name);
CREATE INDEX IF NOT EXISTS idx_competitor_watchlist_competitor_type ON competitor_watchlist(competitor_type);
CREATE INDEX IF NOT EXISTS idx_competitor_watchlist_priority ON competitor_watchlist(priority_level);
CREATE INDEX IF NOT EXISTS idx_competitor_watchlist_alert_enabled ON competitor_watchlist(alert_enabled) WHERE alert_enabled = true;
CREATE INDEX IF NOT EXISTS idx_competitor_watchlist_tags ON competitor_watchlist USING GIN(tags);

-- Add comments
COMMENT ON TABLE competitor_watchlist IS 'Companies/applicants tracked for competitive intelligence';
COMMENT ON COLUMN competitor_watchlist.company_aliases IS 'Alternative names for fuzzy matching (e.g., "D.R. Horton", "DR Horton", "Horton Homes")';
COMMENT ON COLUMN competitor_watchlist.alert_radius_miles IS 'Trigger alert if competitor files permit within this distance of our projects';
COMMENT ON COLUMN competitor_watchlist.priority_level IS 'Alert urgency level for this competitor';

-- ============================================================================
-- TABLE: competitor_permit_matches
-- Purpose: Link permits to watched competitors
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_permit_matches (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relationships
    competitor_id BIGINT NOT NULL REFERENCES competitor_watchlist(id) ON DELETE CASCADE,
    permit_id BIGINT NOT NULL REFERENCES erp_permits(id) ON DELETE CASCADE,
    
    -- Match details
    match_confidence NUMERIC(3, 2) CHECK (match_confidence >= 0 AND match_confidence <= 1), -- 0.0 to 1.0
    match_method TEXT, -- 'exact', 'alias', 'fuzzy', 'manual'
    
    -- Distance analysis (if applicable)
    distance_to_nearest_project_miles NUMERIC(10, 2),
    nearest_project_name TEXT,
    
    -- Alert status
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed BOOLEAN DEFAULT false,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Constraints
    UNIQUE(competitor_id, permit_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_competitor_matches_competitor_id ON competitor_permit_matches(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_matches_permit_id ON competitor_permit_matches(permit_id);
CREATE INDEX IF NOT EXISTS idx_competitor_matches_alert_sent ON competitor_permit_matches(alert_sent) WHERE alert_sent = false;
CREATE INDEX IF NOT EXISTS idx_competitor_matches_reviewed ON competitor_permit_matches(reviewed) WHERE reviewed = false;
CREATE INDEX IF NOT EXISTS idx_competitor_matches_matched_at ON competitor_permit_matches(matched_at DESC);

-- Add comments
COMMENT ON TABLE competitor_permit_matches IS 'Links between permits and watched competitors';
COMMENT ON COLUMN competitor_permit_matches.match_confidence IS 'How confident the matching algorithm is (1.0 = exact match, 0.5 = fuzzy match)';
COMMENT ON COLUMN competitor_permit_matches.match_method IS 'How the match was identified';

-- ============================================================================
-- FUNCTION: add_competitor_to_watchlist
-- Purpose: Add a new competitor with automatic permit matching
-- ============================================================================

CREATE OR REPLACE FUNCTION add_competitor_to_watchlist(
    p_company_name TEXT,
    p_company_aliases TEXT[] DEFAULT NULL,
    p_competitor_type TEXT DEFAULT 'direct',
    p_priority_level TEXT DEFAULT 'medium',
    p_alert_enabled BOOLEAN DEFAULT true,
    p_added_by TEXT DEFAULT 'system'
)
RETURNS BIGINT AS $$
DECLARE
    v_competitor_id BIGINT;
BEGIN
    -- Insert competitor
    INSERT INTO competitor_watchlist (
        company_name,
        company_aliases,
        competitor_type,
        priority_level,
        alert_enabled,
        added_by
    ) VALUES (
        p_company_name,
        p_company_aliases,
        p_competitor_type,
        p_priority_level,
        p_alert_enabled,
        p_added_by
    )
    RETURNING id INTO v_competitor_id;
    
    -- Automatically find and match existing permits
    PERFORM match_competitor_permits(v_competitor_id);
    
    RETURN v_competitor_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_competitor_to_watchlist IS 'Add competitor and automatically match existing permits';

-- ============================================================================
-- FUNCTION: match_competitor_permits
-- Purpose: Find all permits matching a competitor's name/aliases
-- ============================================================================

CREATE OR REPLACE FUNCTION match_competitor_permits(
    p_competitor_id BIGINT
)
RETURNS INTEGER AS $$
DECLARE
    v_competitor RECORD;
    v_matches_found INTEGER := 0;
    v_row_count INTEGER;
    v_alias TEXT;
BEGIN
    -- Get competitor details
    SELECT * INTO v_competitor
    FROM competitor_watchlist
    WHERE id = p_competitor_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Competitor not found: %', p_competitor_id;
    END IF;
    
    -- Match on exact company name
    INSERT INTO competitor_permit_matches (
        competitor_id,
        permit_id,
        match_confidence,
        match_method
    )
    SELECT 
        p_competitor_id,
        p.id,
        1.0,
        'exact'
    FROM erp_permits p
    WHERE p.applicant_name = v_competitor.company_name
    ON CONFLICT (competitor_id, permit_id) DO NOTHING;
    
    GET DIAGNOSTICS v_matches_found = ROW_COUNT;
    
    -- Match on aliases (case-insensitive)
    IF v_competitor.company_aliases IS NOT NULL THEN
        FOREACH v_alias IN ARRAY v_competitor.company_aliases
        LOOP
            INSERT INTO competitor_permit_matches (
                competitor_id,
                permit_id,
                match_confidence,
                match_method
            )
            SELECT 
                p_competitor_id,
                p.id,
                0.95,
                'alias'
            FROM erp_permits p
            WHERE LOWER(p.applicant_name) = LOWER(v_alias)
            ON CONFLICT (competitor_id, permit_id) DO NOTHING;
            
            GET DIAGNOSTICS v_row_count = ROW_COUNT;
            v_matches_found := v_matches_found + v_row_count;
        END LOOP;
    END IF;
    
    -- Fuzzy matching (contains company name)
    INSERT INTO competitor_permit_matches (
        competitor_id,
        permit_id,
        match_confidence,
        match_method
    )
    SELECT 
        p_competitor_id,
        p.id,
        0.75,
        'fuzzy'
    FROM erp_permits p
    WHERE p.applicant_name ILIKE '%' || v_competitor.company_name || '%'
        AND NOT EXISTS (
            SELECT 1 FROM competitor_permit_matches m
            WHERE m.competitor_id = p_competitor_id AND m.permit_id = p.id
        )
    ON CONFLICT (competitor_id, permit_id) DO NOTHING;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_matches_found := v_matches_found + v_row_count;
    
    -- Update competitor statistics
    UPDATE competitor_watchlist
    SET 
        total_permits = (
            SELECT COUNT(*) 
            FROM competitor_permit_matches 
            WHERE competitor_id = p_competitor_id
        ),
        updated_at = NOW()
    WHERE id = p_competitor_id;
    
    RETURN v_matches_found;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION match_competitor_permits IS 'Find and link all permits matching a competitor (exact, alias, and fuzzy matching)';

-- ============================================================================
-- FUNCTION: get_competitor_activity_summary
-- Purpose: Get activity summary for a specific competitor
-- ============================================================================

CREATE OR REPLACE FUNCTION get_competitor_activity_summary(
    p_competitor_id BIGINT,
    p_days_back INTEGER DEFAULT 90
)
RETURNS TABLE (
    company_name TEXT,
    total_permits BIGINT,
    permits_last_90_days BIGINT,
    active_permits BIGINT,
    total_acreage NUMERIC,
    counties TEXT[],
    recent_projects TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.company_name,
        COUNT(DISTINCT m.permit_id) as total_permits,
        COUNT(DISTINCT CASE 
            WHEN p.created_at >= NOW() - (p_days_back || ' days')::INTERVAL 
            THEN m.permit_id 
        END) as permits_last_90_days,
        COUNT(DISTINCT CASE 
            WHEN p.status ILIKE '%active%' OR p.status ILIKE '%issued%' 
            THEN m.permit_id 
        END) as active_permits,
        SUM(p.acreage) as total_acreage,
        ARRAY_AGG(DISTINCT p.county ORDER BY p.county) FILTER (WHERE p.county IS NOT NULL) as counties,
        ARRAY_AGG(DISTINCT p.project_name ORDER BY p.created_at DESC) 
            FILTER (WHERE p.project_name IS NOT NULL) as recent_projects
    FROM competitor_watchlist c
    LEFT JOIN competitor_permit_matches m ON m.competitor_id = c.id
    LEFT JOIN erp_permits p ON p.id = m.permit_id
    WHERE c.id = p_competitor_id
    GROUP BY c.company_name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_competitor_activity_summary IS 'Get comprehensive activity summary for a competitor';

-- ============================================================================
-- FUNCTION: find_nearby_competitor_activity
-- Purpose: Find competitor permits near a specific location
-- ============================================================================

CREATE OR REPLACE FUNCTION find_nearby_competitor_activity(
    p_longitude NUMERIC,
    p_latitude NUMERIC,
    p_radius_miles NUMERIC DEFAULT 5.0,
    p_competitor_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    company_name TEXT,
    competitor_type TEXT,
    priority_level TEXT,
    permit_number TEXT,
    project_name TEXT,
    distance_miles NUMERIC,
    issue_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.company_name,
        c.competitor_type,
        c.priority_level,
        p.permit_number,
        p.project_name,
        ROUND((ST_Distance(
            p.location::geography,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) * 0.000621371)::NUMERIC, 2) as distance_miles,
        p.issue_date
    FROM competitor_watchlist c
    JOIN competitor_permit_matches m ON m.competitor_id = c.id
    JOIN erp_permits p ON p.id = m.permit_id
    WHERE ST_DWithin(
        p.location::geography,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
        p_radius_miles * 1609.34  -- Convert miles to meters
    )
    AND (p_competitor_type IS NULL OR c.competitor_type = p_competitor_type)
    ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_nearby_competitor_activity IS 'Find competitor permits within radius of a location';

-- ============================================================================
-- TRIGGER: Update competitor statistics on permit match
-- ============================================================================

CREATE OR REPLACE FUNCTION update_competitor_statistics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE competitor_watchlist
    SET 
        total_permits = (
            SELECT COUNT(*) 
            FROM competitor_permit_matches 
            WHERE competitor_id = NEW.competitor_id
        ),
        last_permit_date = (
            SELECT MAX(p.issue_date)
            FROM competitor_permit_matches m
            JOIN erp_permits p ON p.id = m.permit_id
            WHERE m.competitor_id = NEW.competitor_id
        ),
        updated_at = NOW()
    WHERE id = NEW.competitor_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_competitor_statistics ON competitor_permit_matches;
CREATE TRIGGER trigger_update_competitor_statistics
    AFTER INSERT OR UPDATE ON competitor_permit_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_competitor_statistics();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE competitor_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_permit_matches ENABLE ROW LEVEL SECURITY;

-- Watchlist policies
DROP POLICY IF EXISTS "Allow authenticated read access to watchlist" ON competitor_watchlist;
CREATE POLICY "Allow authenticated read access to watchlist"
    ON competitor_watchlist
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow service role full access to watchlist" ON competitor_watchlist;
CREATE POLICY "Allow service role full access to watchlist"
    ON competitor_watchlist
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Matches policies
DROP POLICY IF EXISTS "Allow authenticated read access to matches" ON competitor_permit_matches;
CREATE POLICY "Allow authenticated read access to matches"
    ON competitor_permit_matches
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow service role full access to matches" ON competitor_permit_matches;
CREATE POLICY "Allow service role full access to matches"
    ON competitor_permit_matches
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables 
    WHERE table_name IN ('competitor_watchlist', 'competitor_permit_matches');
    
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'add_competitor_to_watchlist',
        'match_competitor_permits',
        'get_competitor_activity_summary',
        'find_nearby_competitor_activity'
    );
    
    IF v_table_count = 2 AND v_function_count = 4 THEN
        RAISE NOTICE 'Migration 005 completed successfully. Created 2 tables and 4 functions.';
    ELSE
        RAISE EXCEPTION 'Migration 005 failed. Found % tables (expected 2) and % functions (expected 4)', 
            v_table_count, v_function_count;
    END IF;
END $$;
