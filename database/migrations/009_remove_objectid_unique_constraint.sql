-- Remove UNIQUE constraint from objectid column
-- Migration 009: Fix duplicate objectid issue in SWFWMD source data
-- Created: 2024-10-24
-- Issue: ETL failing with "duplicate key value violates unique constraint erp_permits_objectid_key"

-- ============================================================================
-- PROBLEM
-- ============================================================================
-- The erp_permits table has a UNIQUE constraint on the objectid column, but
-- the SWFWMD API source data contains duplicate objectid values for different
-- permits. This causes the ETL upsert to fail when trying to insert permits
-- with duplicate objectid values.
--
-- Example from error log:
-- Key (objectid)=(8) already exists.
--
-- This indicates that multiple permit records from SWFWMD have the same objectid,
-- which violates our schema's assumption that objectid should be unique.

-- ============================================================================
-- ANALYSIS
-- ============================================================================
-- The actual unique identifier for permits is permit_number, NOT objectid.
-- The objectid is an internal SWFWMD field that we store for reference, but
-- it's not guaranteed to be unique across all permit records.
--
-- Our ETL correctly uses permit_number for conflict resolution:
--   .upsert(batch, on_conflict='permit_number')
--
-- But PostgreSQL still enforces the UNIQUE constraint on objectid during INSERT,
-- which causes the failure before the conflict resolution logic can run.

-- ============================================================================
-- SOLUTION
-- ============================================================================
-- Remove the UNIQUE constraint from objectid column. Keep it as a regular
-- indexed column for lookups, but don't enforce uniqueness.

-- Drop the unique constraint on objectid
ALTER TABLE erp_permits 
    DROP CONSTRAINT IF EXISTS erp_permits_objectid_key;

-- Keep the regular index for performance (non-unique)
-- The index may have been automatically created by the UNIQUE constraint
-- Drop it and recreate as non-unique
DROP INDEX IF EXISTS erp_permits_objectid_key;

-- Create a regular (non-unique) index on objectid for lookups
CREATE INDEX IF NOT EXISTS idx_erp_permits_objectid ON erp_permits(objectid);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that the constraint is removed
/*
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'erp_permits'::regclass
    AND conname LIKE '%objectid%';
*/

-- Check existing indexes on objectid
/*
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'erp_permits'
    AND indexdef LIKE '%objectid%';
*/

-- Check for duplicate objectid values in existing data
/*
SELECT 
    objectid,
    COUNT(*) as count,
    STRING_AGG(permit_number, ', ') as permit_numbers
FROM erp_permits
WHERE objectid IS NOT NULL
GROUP BY objectid
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 10;
*/

-- ============================================================================
-- IMPACT
-- ============================================================================
-- BEFORE:
-- - objectid has UNIQUE constraint
-- - ETL fails when encountering duplicate objectid values
-- - Pipeline cannot complete successfully
--
-- AFTER:
-- - objectid is a regular indexed column (non-unique)
-- - ETL can insert permits with duplicate objectid values
-- - permit_number remains the true unique identifier
-- - Lookups by objectid still performant due to index

-- ============================================================================
-- NOTES
-- ============================================================================
-- Why is objectid not unique?
-- - It's an internal SWFWMD field that may be reused across different permits
-- - Different permit types or modifications might share objectid values
-- - The API doesn't guarantee objectid uniqueness
-- - permit_number is the official unique identifier per SWFWMD documentation

-- What if we need to look up by objectid?
-- - The non-unique index (idx_erp_permits_objectid) still provides fast lookups
-- - Queries can filter by objectid and may return multiple results
-- - Use permit_number for guaranteed unique lookups

-- Should we keep objectid at all?
-- - Yes, for reference and potential API queries
-- - Some SWFWMD API endpoints might use objectid
-- - Useful for debugging and data lineage
-- - Takes minimal storage space

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback and restore UNIQUE constraint (will fail if duplicates exist):
/*
-- First remove duplicates if any exist
DELETE FROM erp_permits a USING erp_permits b
WHERE a.id < b.id 
  AND a.objectid = b.objectid
  AND a.objectid IS NOT NULL;

-- Then add back the unique constraint
ALTER TABLE erp_permits 
    ADD CONSTRAINT erp_permits_objectid_key UNIQUE (objectid);
*/

-- ============================================================================
-- TESTING
-- ============================================================================
-- After applying this migration, test the ETL:
-- 1. Run the ETL pipeline manually via GitHub Actions
-- 2. Verify it completes without objectid constraint errors
-- 3. Check that data is upserted correctly using permit_number
-- 4. Query for duplicate objectid values to confirm they're allowed

-- Example test insert with duplicate objectid:
/*
-- This should now work without error
INSERT INTO erp_permits (permit_number, objectid, applicant_name)
VALUES 
    ('TEST-001', 999, 'Test Applicant 1'),
    ('TEST-002', 999, 'Test Applicant 2');  -- Same objectid as TEST-001

-- Clean up test data
DELETE FROM erp_permits WHERE permit_number LIKE 'TEST-%';
*/
