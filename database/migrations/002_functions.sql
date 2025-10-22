-- PermitIQ Database Schema - Helper Functions
-- Spatial analysis and utility functions for competitive intelligence
-- Version: 1.0.0
-- Created: 2025-10-22

-- ============================================================================
-- SPATIAL ANALYSIS FUNCTIONS
-- ============================================================================

-- Function: Find permits within radius of a point
-- Usage: SELECT * FROM find_permits_near_point(-82.4572, 27.9506, 1609.34) -- 1 mile in meters
CREATE OR REPLACE FUNCTION find_permits_near_point(
    lng DECIMAL,
    lat DECIMAL,
    radius_meters INTEGER DEFAULT 1609  -- Default 1 mile
)
RETURNS TABLE (
    permit_number VARCHAR,
    applicant_name VARCHAR,
    distance_meters DECIMAL,
    geometry GEOMETRY
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.permit_number,
        p.applicant_name,
        ST_Distance(
            p.geometry::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        )::DECIMAL AS distance_meters,
        p.geometry
    FROM erp_permits p
    WHERE p.geometry IS NOT NULL
    AND ST_DWithin(
        p.geometry::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Function: Detect geographic clusters (for hotspot algorithm)
-- Returns areas with multiple permits within close proximity
CREATE OR REPLACE FUNCTION detect_permit_clusters(
    radius_meters INTEGER DEFAULT 1609,  -- 1 mile
    min_permits INTEGER DEFAULT 5
)
RETURNS TABLE (
    cluster_center GEOMETRY,
    permit_count BIGINT,
    center_lat DECIMAL,
    center_lng DECIMAL,
    county VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH clusters AS (
        SELECT 
            ST_ClusterDBSCAN(geometry, eps := radius_meters, minpoints := min_permits) OVER () AS cluster_id,
            geometry,
            county
        FROM erp_permits
        WHERE geometry IS NOT NULL
        AND issue_date >= CURRENT_DATE - INTERVAL '90 days'
    )
    SELECT 
        ST_Centroid(ST_Collect(geometry)) AS cluster_center,
        COUNT(*) AS permit_count,
        ST_Y(ST_Centroid(ST_Collect(geometry)))::DECIMAL AS center_lat,
        ST_X(ST_Centroid(ST_Collect(geometry)))::DECIMAL AS center_lng,
        county
    FROM clusters
    WHERE cluster_id IS NOT NULL
    GROUP BY cluster_id, county
    HAVING COUNT(*) >= min_permits
    ORDER BY permit_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CHANGE DETECTION FUNCTIONS
-- ============================================================================

-- Function: Compare and log permit changes
-- Called by ETL script to detect what changed in a permit record
CREATE OR REPLACE FUNCTION log_permit_change(
    p_permit_number VARCHAR,
    p_new_data JSONB,
    p_etl_run_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_permit_id BIGINT;
    v_old_data JSONB;
    v_changed_fields TEXT[];
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    -- Get existing permit data
    SELECT id, row_to_json(p.*)::jsonb
    INTO v_permit_id, v_old_data
    FROM erp_permits p
    WHERE permit_number = p_permit_number;
    
    -- If permit doesn't exist, it's a new creation
    IF v_permit_id IS NULL THEN
        INSERT INTO erp_permit_changes (
            permit_number,
            change_type,
            changed_fields,
            new_values,
            permit_snapshot,
            etl_run_id
        ) VALUES (
            p_permit_number,
            'created',
            ARRAY(SELECT jsonb_object_keys(p_new_data)),
            p_new_data,
            p_new_data,
            p_etl_run_id
        );
        RETURN;
    END IF;
    
    -- Find changed fields
    SELECT 
        ARRAY_AGG(key),
        jsonb_object_agg(key, v_old_data->key),
        jsonb_object_agg(key, p_new_data->key)
    INTO v_changed_fields, v_old_values, v_new_values
    FROM jsonb_each(p_new_data)
    WHERE v_old_data->key IS DISTINCT FROM p_new_data->key;
    
    -- Log changes if any fields changed
    IF array_length(v_changed_fields, 1) > 0 THEN
        INSERT INTO erp_permit_changes (
            permit_id,
            permit_number,
            change_type,
            changed_fields,
            old_values,
            new_values,
            permit_snapshot,
            etl_run_id
        ) VALUES (
            v_permit_id,
            p_permit_number,
            'updated',
            v_changed_fields,
            v_old_values,
            v_new_values,
            p_new_data,
            p_etl_run_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STATISTICS & HOTSPOT FUNCTIONS
-- ============================================================================

-- Function: Calculate daily statistics for a specific date
CREATE OR REPLACE FUNCTION calculate_daily_statistics(
    p_stat_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
    -- Delete existing stats for this date (if re-running)
    DELETE FROM erp_statistics WHERE stat_date = p_stat_date;
    
    -- Calculate county-level statistics
    INSERT INTO erp_statistics (
        stat_date,
        county,
        city,
        total_permits,
        new_permits,
        modified_permits,
        active_permits,
        expired_permits,
        total_acreage,
        avg_acreage
    )
    SELECT 
        p_stat_date,
        county,
        NULL AS city,  -- County-level aggregation
        COUNT(*) AS total_permits,
        COUNT(*) FILTER (WHERE created_at::date = p_stat_date) AS new_permits,
        COUNT(*) FILTER (WHERE updated_at::date = p_stat_date AND created_at::date != p_stat_date) AS modified_permits,
        COUNT(*) FILTER (WHERE permit_status = 'Active' OR expiration_date >= p_stat_date) AS active_permits,
        COUNT(*) FILTER (WHERE expiration_date < p_stat_date) AS expired_permits,
        SUM(acreage) AS total_acreage,
        AVG(acreage) AS avg_acreage
    FROM erp_permits
    WHERE county IS NOT NULL
    GROUP BY county;
    
    -- Calculate trend indicators
    UPDATE erp_statistics s
    SET 
        permits_vs_30day_avg = (
            SELECT 
                CASE WHEN AVG(total_permits) > 0 
                THEN ((s.total_permits::DECIMAL / AVG(total_permits)) - 1) * 100
                ELSE 0 END
            FROM erp_statistics
            WHERE county = s.county
            AND stat_date BETWEEN p_stat_date - INTERVAL '30 days' AND p_stat_date - INTERVAL '1 day'
        ),
        permits_vs_90day_avg = (
            SELECT 
                CASE WHEN AVG(total_permits) > 0 
                THEN ((s.total_permits::DECIMAL / AVG(total_permits)) - 1) * 100
                ELSE 0 END
            FROM erp_statistics
            WHERE county = s.county
            AND stat_date BETWEEN p_stat_date - INTERVAL '90 days' AND p_stat_date - INTERVAL '1 day'
        )
    WHERE stat_date = p_stat_date;
    
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate hotspot scores
CREATE OR REPLACE FUNCTION calculate_hotspot_scores(
    p_stat_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
    UPDATE erp_statistics
    SET hotspot_score = (
        -- Base score on multiple factors (0-10 scale)
        LEAST(10, GREATEST(0,
            -- Volume surge (max 4 points)
            CASE 
                WHEN permits_vs_30day_avg >= 200 THEN 4
                WHEN permits_vs_30day_avg >= 100 THEN 3
                WHEN permits_vs_30day_avg >= 50 THEN 2
                WHEN permits_vs_30day_avg >= 25 THEN 1
                ELSE 0
            END
            +
            -- Sustained growth (max 3 points)
            CASE 
                WHEN permits_vs_90day_avg >= 100 THEN 3
                WHEN permits_vs_90day_avg >= 50 THEN 2
                WHEN permits_vs_90day_avg >= 25 THEN 1
                ELSE 0
            END
            +
            -- Absolute volume (max 3 points)
            CASE 
                WHEN new_permits >= 50 THEN 3
                WHEN new_permits >= 25 THEN 2
                WHEN new_permits >= 10 THEN 1
                ELSE 0
            END
        ))
    )
    WHERE stat_date = p_stat_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Search permits by company/applicant name (fuzzy search)
CREATE OR REPLACE FUNCTION search_permits_by_name(
    search_term VARCHAR,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    permit_number VARCHAR,
    applicant_name VARCHAR,
    company_name VARCHAR,
    project_name VARCHAR,
    issue_date DATE,
    county VARCHAR,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.permit_number,
        p.applicant_name,
        p.company_name,
        p.project_name,
        p.issue_date,
        p.county,
        GREATEST(
            similarity(p.applicant_name, search_term),
            similarity(p.company_name, search_term),
            similarity(p.project_name, search_term)
        ) AS similarity_score
    FROM erp_permits p
    WHERE 
        p.applicant_name ILIKE '%' || search_term || '%'
        OR p.company_name ILIKE '%' || search_term || '%'
        OR p.project_name ILIKE '%' || search_term || '%'
    ORDER BY similarity_score DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Enable fuzzy string matching extension for similarity function
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function: Cleanup old change records (keep last 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_changes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM erp_permit_changes
    WHERE change_detected_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Refresh all statistics for recent dates
CREATE OR REPLACE FUNCTION refresh_statistics(days_back INTEGER DEFAULT 7)
RETURNS VOID AS $$
DECLARE
    stat_date DATE;
BEGIN
    FOR stat_date IN 
        SELECT generate_series(
            CURRENT_DATE - (days_back || ' days')::INTERVAL,
            CURRENT_DATE,
            '1 day'::INTERVAL
        )::DATE
    LOOP
        PERFORM calculate_daily_statistics(stat_date);
        PERFORM calculate_hotspot_scores(stat_date);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION find_permits_near_point IS 'Find all permits within specified radius of a point (geography-based)';
COMMENT ON FUNCTION detect_permit_clusters IS 'Identify geographic clusters of permits using DBSCAN algorithm';
COMMENT ON FUNCTION log_permit_change IS 'Compare and log changes to permit records (called by ETL)';
COMMENT ON FUNCTION calculate_daily_statistics IS 'Calculate aggregated daily statistics by county';
COMMENT ON FUNCTION calculate_hotspot_scores IS 'Calculate hotspot scores based on volume, growth, and trends';
COMMENT ON FUNCTION search_permits_by_name IS 'Fuzzy search permits by applicant, company, or project name';
COMMENT ON FUNCTION cleanup_old_changes IS 'Remove change records older than 2 years';
COMMENT ON FUNCTION refresh_statistics IS 'Recalculate statistics for recent dates';
