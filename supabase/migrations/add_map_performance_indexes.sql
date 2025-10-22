-- Add indexes to improve map query performance
-- These indexes will speed up queries filtering by latitude, longitude, issue_date, and updated_at

-- Index for latitude/longitude filtering (used in map queries)
CREATE INDEX IF NOT EXISTS idx_erp_permits_coordinates 
ON erp_permits(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for issue_date filtering (used in 5-year range filter)
CREATE INDEX IF NOT EXISTS idx_erp_permits_issue_date 
ON erp_permits(issue_date) 
WHERE issue_date IS NOT NULL;

-- Index for updated_at ordering (used in ORDER BY clause)
CREATE INDEX IF NOT EXISTS idx_erp_permits_updated_at 
ON erp_permits(updated_at DESC);

-- Composite index for the most common map query pattern
-- (coordinates exist + issue_date filter + updated_at ordering)
CREATE INDEX IF NOT EXISTS idx_erp_permits_map_query 
ON erp_permits(issue_date, updated_at DESC) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for county filtering (used in map filters)
CREATE INDEX IF NOT EXISTS idx_erp_permits_county 
ON erp_permits(county) 
WHERE county IS NOT NULL;

-- Index for permit_type filtering (used in map filters)
CREATE INDEX IF NOT EXISTS idx_erp_permits_type 
ON erp_permits(permit_type) 
WHERE permit_type IS NOT NULL;

-- Add comment explaining the indexes
COMMENT ON INDEX idx_erp_permits_coordinates IS 'Speeds up map queries filtering for valid coordinates';
COMMENT ON INDEX idx_erp_permits_issue_date IS 'Speeds up date range filtering (5 years, etc)';
COMMENT ON INDEX idx_erp_permits_updated_at IS 'Speeds up ordering by updated_at';
COMMENT ON INDEX idx_erp_permits_map_query IS 'Composite index for optimal map query performance';
COMMENT ON INDEX idx_erp_permits_county IS 'Speeds up county filter dropdown';
COMMENT ON INDEX idx_erp_permits_type IS 'Speeds up permit type filter dropdown';
