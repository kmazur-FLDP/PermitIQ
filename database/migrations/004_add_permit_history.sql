-- PermitIQ Database Schema - Migration 004
-- Add permit revision history tracking
-- Version: 1.0.0
-- Created: 2025-10-22

-- ============================================================================
-- TABLE: erp_permit_history
-- Purpose: Track all versions/revisions of each permit over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_permit_history (
    id BIGSERIAL PRIMARY KEY,
    
    -- Link to current permit record
    permit_id BIGINT REFERENCES erp_permits(id) ON DELETE CASCADE,
    
    -- Historical snapshot data
    objectid INTEGER NOT NULL,
    permit_number TEXT NOT NULL,
    applicant_name TEXT,
    project_name TEXT,
    status TEXT,
    issue_date TIMESTAMP WITH TIME ZONE,
    effective_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    acreage NUMERIC(12, 4),
    county TEXT,
    
    -- Geometry data (historical boundaries)
    geometry GEOMETRY(Polygon, 4326),
    location GEOMETRY(Point, 4326),
    
    -- Metadata
    raw_data JSONB NOT NULL,
    revision_number INTEGER NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(permit_number, objectid)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_permit_history_permit_id ON erp_permit_history(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_history_permit_number ON erp_permit_history(permit_number);
CREATE INDEX IF NOT EXISTS idx_permit_history_objectid ON erp_permit_history(objectid);
CREATE INDEX IF NOT EXISTS idx_permit_history_captured_at ON erp_permit_history(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_permit_history_geometry ON erp_permit_history USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_permit_history_location ON erp_permit_history USING GIST(location);

-- Add comments
COMMENT ON TABLE erp_permit_history IS 'Historical versions of all permits, tracking revisions over time';
COMMENT ON COLUMN erp_permit_history.permit_id IS 'Foreign key to current permit record in erp_permits';
COMMENT ON COLUMN erp_permit_history.objectid IS 'SWFWMD OBJECTID at time of capture';
COMMENT ON COLUMN erp_permit_history.revision_number IS 'Sequential revision number for this permit (1, 2, 3...)';
COMMENT ON COLUMN erp_permit_history.captured_at IS 'When this revision was captured from the API';
COMMENT ON COLUMN erp_permit_history.geometry IS 'Historical polygon boundary at time of revision';
COMMENT ON COLUMN erp_permit_history.location IS 'Historical centroid at time of revision';

-- ============================================================================
-- FUNCTION: get_permit_revision_history
-- Purpose: Retrieve all historical versions of a specific permit
-- ============================================================================

CREATE OR REPLACE FUNCTION get_permit_revision_history(
    p_permit_number TEXT
)
RETURNS TABLE (
    revision_number INTEGER,
    objectid INTEGER,
    applicant_name TEXT,
    project_name TEXT,
    status TEXT,
    issue_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    acreage NUMERIC,
    captured_at TIMESTAMP WITH TIME ZONE,
    geometry_changed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.revision_number,
        h.objectid,
        h.applicant_name,
        h.project_name,
        h.status,
        h.issue_date,
        h.expiration_date,
        h.acreage,
        h.captured_at,
        -- Detect if geometry changed from previous revision
        CASE 
            WHEN LAG(h.geometry) OVER (ORDER BY h.revision_number) IS NULL THEN FALSE
            WHEN NOT ST_Equals(h.geometry, LAG(h.geometry) OVER (ORDER BY h.revision_number)) THEN TRUE
            ELSE FALSE
        END as geometry_changed
    FROM erp_permit_history h
    WHERE h.permit_number = p_permit_number
    ORDER BY h.revision_number DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_permit_revision_history IS 'Get complete revision history for a permit with change detection';

-- ============================================================================
-- FUNCTION: find_permits_with_recent_revisions
-- Purpose: Find permits that have been revised in the last N days
-- ============================================================================

CREATE OR REPLACE FUNCTION find_permits_with_recent_revisions(
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    permit_number TEXT,
    revision_count BIGINT,
    latest_revision_date TIMESTAMP WITH TIME ZONE,
    current_applicant TEXT,
    current_project TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.permit_number,
        COUNT(*) as revision_count,
        MAX(h.captured_at) as latest_revision_date,
        MAX(h.applicant_name) as current_applicant,
        MAX(h.project_name) as current_project
    FROM erp_permit_history h
    WHERE h.captured_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY h.permit_number
    HAVING COUNT(*) > 1
    ORDER BY latest_revision_date DESC, revision_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_permits_with_recent_revisions IS 'Find permits with multiple revisions in recent time period';

-- ============================================================================
-- FUNCTION: compare_permit_revisions
-- Purpose: Compare two revisions of the same permit
-- ============================================================================

CREATE OR REPLACE FUNCTION compare_permit_revisions(
    p_permit_number TEXT,
    p_revision_1 INTEGER,
    p_revision_2 INTEGER
)
RETURNS TABLE (
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    changed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH rev1 AS (
        SELECT * FROM erp_permit_history 
        WHERE permit_number = p_permit_number AND revision_number = p_revision_1
    ),
    rev2 AS (
        SELECT * FROM erp_permit_history 
        WHERE permit_number = p_permit_number AND revision_number = p_revision_2
    )
    SELECT 
        'applicant_name'::TEXT as field_name,
        r1.applicant_name as old_value,
        r2.applicant_name as new_value,
        (r1.applicant_name IS DISTINCT FROM r2.applicant_name) as changed
    FROM rev1 r1, rev2 r2
    UNION ALL
    SELECT 
        'project_name'::TEXT,
        r1.project_name,
        r2.project_name,
        (r1.project_name IS DISTINCT FROM r2.project_name)
    FROM rev1 r1, rev2 r2
    UNION ALL
    SELECT 
        'status'::TEXT,
        r1.status,
        r2.status,
        (r1.status IS DISTINCT FROM r2.status)
    FROM rev1 r1, rev2 r2
    UNION ALL
    SELECT 
        'acreage'::TEXT,
        r1.acreage::TEXT,
        r2.acreage::TEXT,
        (r1.acreage IS DISTINCT FROM r2.acreage)
    FROM rev1 r1, rev2 r2
    UNION ALL
    SELECT 
        'geometry'::TEXT,
        CASE WHEN r1.geometry IS NOT NULL THEN 'Present' ELSE 'NULL' END,
        CASE WHEN r2.geometry IS NOT NULL THEN 'Present' ELSE 'NULL' END,
        NOT ST_Equals(r1.geometry, r2.geometry)
    FROM rev1 r1, rev2 r2;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION compare_permit_revisions IS 'Compare two specific revisions of a permit to identify changes';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE erp_permit_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read history
DROP POLICY IF EXISTS "Allow authenticated read access to permit history" ON erp_permit_history;
CREATE POLICY "Allow authenticated read access to permit history"
    ON erp_permit_history
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow service role full access
DROP POLICY IF EXISTS "Allow service role full access to permit history" ON erp_permit_history;
CREATE POLICY "Allow service role full access to permit history"
    ON erp_permit_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_permit_history') THEN
        RAISE NOTICE 'Migration 004 completed successfully. Table erp_permit_history created with % indexes and 3 functions.',
            (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'erp_permit_history');
    ELSE
        RAISE EXCEPTION 'Migration 004 failed. Table erp_permit_history not found.';
    END IF;
END $$;
