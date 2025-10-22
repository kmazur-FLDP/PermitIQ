-- PermitIQ Database Schema - Migration 003
-- Add polygon geometry support to erp_permits table
-- Version: 1.0.0
-- Created: 2025-10-22

-- ============================================================================
-- ALTER TABLE: erp_permits
-- Add geometry column for storing full polygon boundaries
-- Update location column if it doesn't exist
-- ============================================================================

-- Drop dependent views first
DROP VIEW IF EXISTS recent_permit_activity CASCADE;
DROP VIEW IF EXISTS active_hotspots CASCADE;

-- Drop existing geometry column if it exists (it was Point type, we need Polygon)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'erp_permits' AND column_name = 'geometry'
    ) THEN
        -- Drop the index first
        DROP INDEX IF EXISTS idx_erp_permits_geometry;
        -- Drop the column
        ALTER TABLE erp_permits DROP COLUMN geometry;
    END IF;
END $$;

-- Add geometry column for polygon boundaries
ALTER TABLE erp_permits ADD COLUMN geometry GEOMETRY(Polygon, 4326);
COMMENT ON COLUMN erp_permits.geometry IS 'PostGIS polygon geometry for project boundaries (WGS84/EPSG:4326)';

-- Add location column for point centroids if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'erp_permits' AND column_name = 'location'
    ) THEN
        ALTER TABLE erp_permits ADD COLUMN location GEOMETRY(Point, 4326);
        COMMENT ON COLUMN erp_permits.location IS 'PostGIS point geometry for centroids (WGS84/EPSG:4326)';
    END IF;
END $$;

-- Create spatial indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_erp_permits_geometry ON erp_permits USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_erp_permits_location ON erp_permits USING GIST(location);

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Recreate views that depend on erp_permits
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

CREATE OR REPLACE VIEW active_hotspots AS
SELECT *
FROM erp_statistics
WHERE hotspot_score >= 5.0
  AND stat_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY hotspot_score DESC, stat_date DESC;

-- Verify the columns exist
DO $$
DECLARE
    geometry_exists BOOLEAN;
    location_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'erp_permits' AND column_name = 'geometry'
    ) INTO geometry_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'erp_permits' AND column_name = 'location'
    ) INTO location_exists;
    
    IF geometry_exists AND location_exists THEN
        RAISE NOTICE 'Migration 003 completed successfully. Columns geometry and location are ready.';
    ELSE
        RAISE EXCEPTION 'Migration 003 failed. Missing columns: geometry=%, location=%', 
            geometry_exists, location_exists;
    END IF;
END $$;
