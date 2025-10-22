-- Diagnostic queries to run in Supabase SQL Editor

-- 1. Check if views exist
SELECT schemaname, matviewname 
FROM pg_matviews 
WHERE matviewname LIKE 'dashboard_%';

-- 2. Check if erp_permits has county data
SELECT county, COUNT(*) as count 
FROM erp_permits 
WHERE county IS NOT NULL 
GROUP BY county 
ORDER BY count DESC 
LIMIT 5;

-- 3. Try to select from dashboard_county_stats
SELECT * FROM dashboard_county_stats LIMIT 5;

-- 4. If the view exists but has no data, refresh it
SELECT refresh_dashboard_stats();

-- 5. Check again
SELECT * FROM dashboard_county_stats LIMIT 5;
