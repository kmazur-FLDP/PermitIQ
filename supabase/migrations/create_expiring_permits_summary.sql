-- Create function to get permits expiring soon
-- Returns permits expiring in next 30, 60, and 90 days

DROP FUNCTION IF EXISTS get_expiring_permits_summary();

CREATE OR REPLACE FUNCTION get_expiring_permits_summary()
RETURNS TABLE (
  time_period text,
  days_range text,
  permit_count bigint,
  total_acreage numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM (
    -- Expiring in next 30 days
    SELECT 
      '30 Days' as time_period,
      '0-30 days' as days_range,
      COUNT(*)::bigint as permit_count,
      COALESCE(SUM(acreage), 0) as total_acreage
    FROM erp_permits
    WHERE expiration_date IS NOT NULL
      AND expiration_date >= CURRENT_DATE
      AND expiration_date <= CURRENT_DATE + INTERVAL '30 days'
    
    UNION ALL
    
    -- Expiring in next 31-60 days
    SELECT 
      '60 Days' as time_period,
      '31-60 days' as days_range,
      COUNT(*)::bigint as permit_count,
      COALESCE(SUM(acreage), 0) as total_acreage
    FROM erp_permits
    WHERE expiration_date IS NOT NULL
      AND expiration_date > CURRENT_DATE + INTERVAL '30 days'
      AND expiration_date <= CURRENT_DATE + INTERVAL '60 days'
    
    UNION ALL
    
    -- Expiring in next 61-90 days
    SELECT 
      '90 Days' as time_period,
      '61-90 days' as days_range,
      COUNT(*)::bigint as permit_count,
      COALESCE(SUM(acreage), 0) as total_acreage
    FROM erp_permits
    WHERE expiration_date IS NOT NULL
      AND expiration_date > CURRENT_DATE + INTERVAL '60 days'
      AND expiration_date <= CURRENT_DATE + INTERVAL '90 days'
  ) sub
  ORDER BY 
    CASE time_period
      WHEN '30 Days' THEN 1
      WHEN '60 Days' THEN 2
      WHEN '90 Days' THEN 3
    END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_expiring_permits_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_permits_summary() TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION get_expiring_permits_summary() IS 
  'Returns count and total acreage of permits expiring in next 30, 60, and 90 days. Created 2025-10-23 for expiring permits widget.';
