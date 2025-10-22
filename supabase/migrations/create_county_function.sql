-- Solution: Create functions with SECURITY DEFINER to bypass RLS

-- Function to get county stats (bypasses RLS)
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_county_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_county_stats() TO anon;

-- Test it
SELECT * FROM get_dashboard_county_stats();
