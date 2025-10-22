-- Check how many counties were populated
SELECT 
  COUNT(*) as total_permits,
  COUNT(county) as permits_with_county,
  COUNT(DISTINCT county) as unique_counties
FROM erp_permits;

-- See the county breakdown
SELECT 
  county,
  COUNT(*) as permit_count
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY permit_count DESC;

-- Now create the county stats function (replaces permit_type)
DROP FUNCTION IF EXISTS get_dashboard_permit_type_stats();

CREATE OR REPLACE FUNCTION get_dashboard_county_stats()
RETURNS TABLE (
  county text,
  permit_count bigint,
  avg_acreage numeric,
  total_acreage numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_county_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_county_stats() TO anon;

-- Test it
SELECT * FROM get_dashboard_county_stats();
