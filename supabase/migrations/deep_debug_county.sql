-- Deep debug: Check what's actually in the materialized view

-- 1. Query directly as postgres (this should work)
SELECT COUNT(*) FROM dashboard_county_stats;

-- 2. Check the actual data in the view
SELECT * FROM dashboard_county_stats LIMIT 10;

-- 3. Try creating a regular view instead (for testing)
DROP VIEW IF EXISTS dashboard_county_stats_test CASCADE;

CREATE VIEW dashboard_county_stats_test AS
SELECT 
  county,
  COUNT(*) as permit_count,
  AVG(acreage) as avg_acreage,
  SUM(acreage) as total_acreage
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY COUNT(*) DESC;

-- Make it security definer (bypasses RLS)
ALTER VIEW dashboard_county_stats_test SET (security_invoker = off);
GRANT SELECT ON dashboard_county_stats_test TO authenticated;
GRANT SELECT ON dashboard_county_stats_test TO anon;

-- 4. Test the regular view
SELECT COUNT(*) FROM dashboard_county_stats_test;
SELECT * FROM dashboard_county_stats_test LIMIT 10;

-- 5. Check what role the authenticated user is using
SELECT current_user, session_user;

-- 6. Try to query erp_permits directly with the same filter
SELECT county, COUNT(*) as count
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY count DESC
LIMIT 10;
