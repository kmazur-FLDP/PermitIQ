-- Simple test to see what the function returns

-- 1. Test the function directly
SELECT * FROM get_dashboard_county_stats();

-- 2. Count how many rows it returns
SELECT COUNT(*) FROM get_dashboard_county_stats();

-- 3. Test the underlying query
SELECT 
  county::text,
  COUNT(*)::bigint as permit_count,
  AVG(acreage) as avg_acreage,
  SUM(acreage) as total_acreage
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 4. Just check if we have ANY county data at all
SELECT COUNT(DISTINCT county) as unique_counties FROM erp_permits WHERE county IS NOT NULL;

-- 5. Sample a few permits with counties
SELECT permit_number, county, acreage FROM erp_permits WHERE county IS NOT NULL LIMIT 10;
