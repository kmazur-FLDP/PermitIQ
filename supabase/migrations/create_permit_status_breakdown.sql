-- Create function to get permit status breakdown with counts
-- This supports the Permit Status Dashboard Widget feature

DROP FUNCTION IF EXISTS get_permit_status_breakdown();

CREATE OR REPLACE FUNCTION get_permit_status_breakdown()
RETURNS TABLE (
  status_category text,
  permit_count bigint,
  percentage numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH status_counts AS (
    SELECT 
      CASE 
        WHEN LOWER(permit_status) LIKE '%active%' OR LOWER(permit_status) LIKE '%issued%' THEN 'Active'
        WHEN LOWER(permit_status) LIKE '%expired%' OR LOWER(permit_status) LIKE '%expiration%' THEN 'Expired'
        WHEN LOWER(permit_status) LIKE '%pending%' OR LOWER(permit_status) LIKE '%review%' OR LOWER(permit_status) LIKE '%processing%' THEN 'Pending'
        WHEN LOWER(permit_status) LIKE '%denied%' OR LOWER(permit_status) LIKE '%rejected%' THEN 'Denied'
        WHEN LOWER(permit_status) LIKE '%withdrawn%' OR LOWER(permit_status) LIKE '%cancelled%' THEN 'Withdrawn'
        ELSE 'Other'
      END as status_category,
      COUNT(*) as count
    FROM erp_permits
    WHERE permit_status IS NOT NULL
    GROUP BY status_category
  ),
  total_count AS (
    SELECT SUM(count) as total FROM status_counts
  )
  SELECT 
    sc.status_category,
    sc.count::bigint as permit_count,
    ROUND((sc.count::numeric / tc.total::numeric * 100), 2) as percentage
  FROM status_counts sc, total_count tc
  ORDER BY sc.count DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_permit_status_breakdown() TO authenticated;
GRANT EXECUTE ON FUNCTION get_permit_status_breakdown() TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION get_permit_status_breakdown() IS 
  'Returns permit counts grouped by status category (Active, Expired, Pending, etc.) with percentages. Created 2025-10-23 for status widget.';
