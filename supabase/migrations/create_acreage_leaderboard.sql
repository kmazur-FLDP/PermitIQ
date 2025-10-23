-- Create function to get top permits by acreage
-- Returns top 10 largest permits with optional filters

DROP FUNCTION IF EXISTS get_acreage_leaderboard(text, text);

CREATE OR REPLACE FUNCTION get_acreage_leaderboard(
  filter_county text DEFAULT NULL,
  filter_permit_type text DEFAULT NULL
)
RETURNS TABLE (
  rank bigint,
  permit_number text,
  applicant_name text,
  project_name text,
  county text,
  permit_type text,
  acreage numeric,
  issue_date date,
  permit_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY acreage DESC NULLS LAST) as rank,
    permit_number,
    applicant_name,
    project_name,
    county,
    permit_type,
    acreage,
    issue_date::date,
    permit_status
  FROM erp_permits
  WHERE acreage IS NOT NULL
    AND acreage > 0
    AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND (filter_county IS NULL OR county = filter_county)
    AND (filter_permit_type IS NULL OR permit_type = filter_permit_type)
  ORDER BY acreage DESC
  LIMIT 10;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_acreage_leaderboard(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_acreage_leaderboard(text, text) TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION get_acreage_leaderboard(text, text) IS 
  'Returns top 10 largest permits by acreage for current year with optional county and permit type filters. Created 2025-10-23.';
