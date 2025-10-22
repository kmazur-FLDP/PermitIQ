-- Check if dashboard views exist and have data

-- 1. Check county stats
SELECT 'County Stats Count:' as check, COUNT(*) as count FROM dashboard_county_stats;
SELECT * FROM dashboard_county_stats LIMIT 5;

-- 2. Check status stats
SELECT 'Status Stats Count:' as check, COUNT(*) as count FROM dashboard_status_stats;
SELECT * FROM dashboard_status_stats;

-- 3. Check overall stats
SELECT 'Overall Stats:' as check;
SELECT * FROM dashboard_overall_stats;

-- 4. Refresh all views
SELECT refresh_dashboard_stats();

-- 5. Re-check county stats after refresh
SELECT 'County Stats After Refresh:' as check, COUNT(*) as count FROM dashboard_county_stats;
SELECT * FROM dashboard_county_stats LIMIT 5;
