-- Create function to get city stats instead of county

-- Drop old county function
DROP FUNCTION IF EXISTS get_dashboard_county_stats();

-- Create new city stats function
CREATE OR REPLACE FUNCTION get_dashboard_city_stats()
RETURNS TABLE (
  city text,
  permit_count bigint,
  avg_acreage numeric,
  total_acreage numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    city::text,
    COUNT(*)::bigint as permit_count,
    AVG(acreage) as avg_acreage,
    SUM(acreage) as total_acreage
  FROM erp_permits
  WHERE city IS NOT NULL
  GROUP BY city
  ORDER BY COUNT(*) DESC
  LIMIT 10;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_city_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_city_stats() TO anon;

-- Test it
SELECT * FROM get_dashboard_city_stats();

-- Also check how many cities we have
SELECT COUNT(DISTINCT city) as unique_cities FROM erp_permits WHERE city IS NOT NULL;
