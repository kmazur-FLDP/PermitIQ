-- Debug: Check if erp_permits has county data

-- 1. Count total permits
SELECT 'Total Permits:' as check, COUNT(*) as count FROM erp_permits;

-- 2. Count permits with county
SELECT 'Permits with County:' as check, COUNT(*) as count FROM erp_permits WHERE county IS NOT NULL;

-- 3. Sample some county values
SELECT county, COUNT(*) as count 
FROM erp_permits 
WHERE county IS NOT NULL 
GROUP BY county 
ORDER BY count DESC 
LIMIT 10;

-- 4. Check what the view definition is
SELECT definition 
FROM pg_matviews 
WHERE matviewname = 'dashboard_county_stats';

-- 5. Try the query manually (what the view should be doing)
SELECT 
  county,
  COUNT(*) as permit_count,
  AVG(acreage) as avg_acreage,
  SUM(acreage) as total_acreage
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY permit_count DESC
LIMIT 10;
