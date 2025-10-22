-- Fix: Check and disable RLS on materialized views

-- 1. Check if RLS is enabled on erp_permits
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'erp_permits';

-- 2. Check RLS policies on erp_permits
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'erp_permits';

-- 3. The issue: Materialized views can't have RLS, but they might be affected by the owner's permissions
-- Solution: Make sure the materialized views are owned by postgres (superuser)
-- and grant proper access to authenticated users

-- Drop and recreate the county stats view with proper ownership
DROP MATERIALIZED VIEW IF EXISTS dashboard_county_stats CASCADE;

CREATE MATERIALIZED VIEW dashboard_county_stats AS
SELECT 
  county,
  COUNT(*) as permit_count,
  AVG(acreage) as avg_acreage,
  SUM(acreage) as total_acreage
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY permit_count DESC;

-- Make postgres the owner (bypasses RLS)
ALTER MATERIALIZED VIEW dashboard_county_stats OWNER TO postgres;

-- Create index
CREATE INDEX IF NOT EXISTS idx_dashboard_county_stats_county ON dashboard_county_stats(county);

-- Grant SELECT to authenticated users
GRANT SELECT ON dashboard_county_stats TO authenticated;
GRANT SELECT ON dashboard_county_stats TO anon;

-- Refresh to populate
REFRESH MATERIALIZED VIEW dashboard_county_stats;

-- Check results
SELECT COUNT(*) as total_rows FROM dashboard_county_stats;
SELECT * FROM dashboard_county_stats LIMIT 10;
