-- Create function to get permit type stats (since county/city are empty)

-- Drop old city function
DROP FUNCTION IF EXISTS get_dashboard_city_stats();

-- Create permit type stats function
CREATE OR REPLACE FUNCTION get_dashboard_permit_type_stats()
RETURNS TABLE (
  permit_type text,
  permit_count bigint,
  avg_acreage numeric,
  total_acreage numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    permit_type::text,
    COUNT(*)::bigint as permit_count,
    AVG(acreage) as avg_acreage,
    SUM(acreage) as total_acreage
  FROM erp_permits
  WHERE permit_type IS NOT NULL
  GROUP BY permit_type
  ORDER BY COUNT(*) DESC
  LIMIT 10;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_permit_type_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_permit_type_stats() TO anon;

-- Test it
SELECT * FROM get_dashboard_permit_type_stats();
