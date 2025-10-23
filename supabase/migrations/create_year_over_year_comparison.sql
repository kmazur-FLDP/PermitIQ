-- Create function to get year-over-year permit comparison
-- Compares current year (2025) with previous year (2024)

DROP FUNCTION IF EXISTS get_year_over_year_comparison();

CREATE OR REPLACE FUNCTION get_year_over_year_comparison()
RETURNS TABLE (
  metric text,
  current_year_value bigint,
  previous_year_value bigint,
  change_count bigint,
  change_percentage numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_year_stats AS (
    SELECT 
      COUNT(*) as total_permits,
      COALESCE(SUM(acreage), 0) as total_acreage,
      COALESCE(AVG(acreage), 0) as avg_acreage
    FROM erp_permits
    WHERE EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND issue_date IS NOT NULL
  ),
  previous_year_stats AS (
    SELECT 
      COUNT(*) as total_permits,
      COALESCE(SUM(acreage), 0) as total_acreage,
      COALESCE(AVG(acreage), 0) as avg_acreage
    FROM erp_permits
    WHERE EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
      AND issue_date IS NOT NULL
  )
  SELECT * FROM (
    -- Total Permits comparison
    SELECT 
      'Total Permits' as metric,
      cy.total_permits as current_year_value,
      py.total_permits as previous_year_value,
      (cy.total_permits - py.total_permits) as change_count,
      CASE 
        WHEN py.total_permits > 0 THEN 
          ROUND(((cy.total_permits - py.total_permits)::numeric / py.total_permits::numeric * 100), 2)
        ELSE 0
      END as change_percentage
    FROM current_year_stats cy, previous_year_stats py
    
    UNION ALL
    
    -- Total Acreage comparison
    SELECT 
      'Total Acreage' as metric,
      cy.total_acreage::bigint as current_year_value,
      py.total_acreage::bigint as previous_year_value,
      (cy.total_acreage - py.total_acreage)::bigint as change_count,
      CASE 
        WHEN py.total_acreage > 0 THEN 
          ROUND(((cy.total_acreage - py.total_acreage)::numeric / py.total_acreage::numeric * 100), 2)
        ELSE 0
      END as change_percentage
    FROM current_year_stats cy, previous_year_stats py
    
    UNION ALL
    
    -- Average Acreage comparison
    SELECT 
      'Avg Acreage' as metric,
      ROUND(cy.avg_acreage)::bigint as current_year_value,
      ROUND(py.avg_acreage)::bigint as previous_year_value,
      (ROUND(cy.avg_acreage) - ROUND(py.avg_acreage))::bigint as change_count,
      CASE 
        WHEN py.avg_acreage > 0 THEN 
          ROUND(((cy.avg_acreage - py.avg_acreage)::numeric / py.avg_acreage::numeric * 100), 2)
        ELSE 0
      END as change_percentage
    FROM current_year_stats cy, previous_year_stats py
  ) sub
  ORDER BY metric;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_year_over_year_comparison() TO authenticated;
GRANT EXECUTE ON FUNCTION get_year_over_year_comparison() TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION get_year_over_year_comparison() IS 
  'Returns year-over-year comparison of key metrics (permits, acreage) between current and previous year. Created 2025-10-23.';
