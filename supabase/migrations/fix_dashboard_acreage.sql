-- Fix the dashboard_overall_stats view to use correct field name
-- The actual column name is 'acreage' (not 'total_acreage')
-- No change needed - the original view was correct!

-- Just refresh the view to ensure it has the latest data
REFRESH MATERIALIZED VIEW dashboard_overall_stats;

-- Verify the view definition
SELECT 
  total_permits,
  total_counties,
  avg_acreage,
  permits_last_30_days,
  top_county,
  top_county_count
FROM dashboard_overall_stats;

COMMENT ON MATERIALIZED VIEW dashboard_overall_stats IS 'Overall permit statistics including average acreage (uses acreage column, not total_acreage)';
