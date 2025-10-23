-- Update function to get permits over time for last 24 months (2 years)

DROP FUNCTION IF EXISTS get_dashboard_permits_over_time();

CREATE OR REPLACE FUNCTION get_dashboard_permits_over_time()
RETURNS TABLE (
  month text,
  permit_count bigint,
  year_month date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    TO_CHAR(date_trunc('month', issue_date), 'Mon YYYY') as month,
    COUNT(*)::bigint as permit_count,
    date_trunc('month', issue_date)::date as year_month
  FROM erp_permits
  WHERE issue_date IS NOT NULL
    AND issue_date >= CURRENT_DATE - INTERVAL '24 months'
  GROUP BY date_trunc('month', issue_date)
  ORDER BY date_trunc('month', issue_date) ASC;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_permits_over_time() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_permits_over_time() TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION get_dashboard_permits_over_time() IS 
  'Returns monthly permit counts for the last 24 months (2 years). Updated from 12 months on 2025-10-23.';
