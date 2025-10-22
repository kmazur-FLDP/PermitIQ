-- Migration: Add materialized views for dashboard statistics
-- This will pre-calculate aggregations for fast dashboard loading

-- 1. County statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_county_stats AS
SELECT 
  county,
  COUNT(*) as permit_count,
  AVG(acreage) as avg_acreage,
  SUM(acreage) as total_acreage
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY permit_count DESC;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_dashboard_county_stats_county ON dashboard_county_stats(county);

-- 2. Status statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_status_stats AS
SELECT 
  permit_status as status,
  COUNT(*) as permit_count
FROM erp_permits
WHERE permit_status IS NOT NULL
GROUP BY permit_status
ORDER BY permit_count DESC;

-- 3. Applicant statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_applicant_stats AS
SELECT 
  applicant_name,
  COUNT(*) as permit_count
FROM erp_permits
WHERE applicant_name IS NOT NULL
GROUP BY applicant_name
ORDER BY permit_count DESC
LIMIT 50;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_dashboard_applicant_stats ON dashboard_applicant_stats(applicant_name);

-- 4. Monthly trend view (last 24 months)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_monthly_trends AS
SELECT 
  DATE_TRUNC('month', issue_date) as month,
  COUNT(*) as permit_count
FROM erp_permits
WHERE issue_date IS NOT NULL
  AND issue_date >= NOW() - INTERVAL '24 months'
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month DESC;

-- 5. Overall statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_overall_stats AS
SELECT 
  COUNT(*) as total_permits,
  COUNT(DISTINCT county) as total_counties,
  AVG(acreage) as avg_acreage,
  (SELECT COUNT(*) 
   FROM erp_permits 
   WHERE issue_date >= NOW() - INTERVAL '30 days') as permits_last_30_days,
  (SELECT county 
   FROM erp_permits 
   WHERE county IS NOT NULL 
   GROUP BY county 
   ORDER BY COUNT(*) DESC 
   LIMIT 1) as top_county,
  (SELECT COUNT(*) 
   FROM erp_permits 
   WHERE county = (
     SELECT county 
     FROM erp_permits 
     WHERE county IS NOT NULL 
     GROUP BY county 
     ORDER BY COUNT(*) DESC 
     LIMIT 1
   )) as top_county_count
FROM erp_permits;

-- Function to refresh all dashboard materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_county_stats;
  REFRESH MATERIALIZED VIEW dashboard_status_stats;
  REFRESH MATERIALIZED VIEW dashboard_applicant_stats;
  REFRESH MATERIALIZED VIEW dashboard_monthly_trends;
  REFRESH MATERIALIZED VIEW dashboard_overall_stats;
END;
$$ LANGUAGE plpgsql;

-- Refresh the views initially
SELECT refresh_dashboard_stats();

-- Disable RLS on materialized views (they are read-only aggregations)
ALTER MATERIALIZED VIEW dashboard_county_stats OWNER TO postgres;
ALTER MATERIALIZED VIEW dashboard_status_stats OWNER TO postgres;
ALTER MATERIALIZED VIEW dashboard_applicant_stats OWNER TO postgres;
ALTER MATERIALIZED VIEW dashboard_monthly_trends OWNER TO postgres;
ALTER MATERIALIZED VIEW dashboard_overall_stats OWNER TO postgres;

-- Grant permissions
GRANT SELECT ON dashboard_county_stats TO authenticated;
GRANT SELECT ON dashboard_status_stats TO authenticated;
GRANT SELECT ON dashboard_applicant_stats TO authenticated;
GRANT SELECT ON dashboard_monthly_trends TO authenticated;
GRANT SELECT ON dashboard_overall_stats TO authenticated;

-- Note: In production, you should refresh these views periodically
-- For example, add this to your ETL cron job:
-- SELECT refresh_dashboard_stats();
