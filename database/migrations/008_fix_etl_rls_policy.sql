-- Fix RLS Policy for ETL Pipeline
-- Migration 008: Allow service role and anon role to write to erp_permits table
-- Created: 2024-10-24
-- Issue: ETL pipeline failing with "new row violates row-level security policy"

-- ============================================================================
-- PROBLEM
-- ============================================================================
-- The erp_permits table has RLS enabled (implicitly or from previous migration)
-- but no policies exist to allow the service role or anon role to INSERT/UPDATE
-- records. This causes the ETL pipeline to fail when trying to upsert permit data.

-- ============================================================================
-- SOLUTION
-- ============================================================================
-- 1. Explicitly disable RLS on erp_permits (public data, no user-specific access)
-- 2. OR create policies that allow service role full access
-- 3. Create policies that allow authenticated and anon users to read data

-- ============================================================================
-- APPROACH: Disable RLS (Recommended for public permit data)
-- ============================================================================

-- The erp_permits table contains public government data that all authenticated
-- users should be able to read. There's no need for row-level restrictions.
-- The ETL service needs to write data without restrictions.

-- Disable RLS on erp_permits table
ALTER TABLE erp_permits DISABLE ROW LEVEL SECURITY;

-- Disable RLS on erp_permit_changes table (ETL writes change history)
ALTER TABLE erp_permit_changes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on erp_statistics table (ETL writes daily stats)
ALTER TABLE erp_statistics DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ALTERNATIVE APPROACH: Keep RLS enabled with permissive policies
-- ============================================================================
-- If you prefer to keep RLS enabled for audit purposes, uncomment below:

/*
-- Enable RLS on public data tables
ALTER TABLE erp_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_permit_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_statistics ENABLE ROW LEVEL SECURITY;

-- Allow service role (ETL) full access to erp_permits
DROP POLICY IF EXISTS "Service role full access to permits" ON erp_permits;
CREATE POLICY "Service role full access to permits"
    ON erp_permits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read all permits
DROP POLICY IF EXISTS "Authenticated users can read permits" ON erp_permits;
CREATE POLICY "Authenticated users can read permits"
    ON erp_permits
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow anon users to read all permits (for public map)
DROP POLICY IF EXISTS "Anonymous users can read permits" ON erp_permits;
CREATE POLICY "Anonymous users can read permits"
    ON erp_permits
    FOR SELECT
    TO anon
    USING (true);

-- Allow service role to write permit changes
DROP POLICY IF EXISTS "Service role full access to changes" ON erp_permit_changes;
CREATE POLICY "Service role full access to changes"
    ON erp_permit_changes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read changes
DROP POLICY IF EXISTS "Authenticated users can read changes" ON erp_permit_changes;
CREATE POLICY "Authenticated users can read changes"
    ON erp_permit_changes
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow service role to write statistics
DROP POLICY IF EXISTS "Service role full access to statistics" ON erp_statistics;
CREATE POLICY "Service role full access to statistics"
    ON erp_statistics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read statistics
DROP POLICY IF EXISTS "Authenticated users can read statistics" ON erp_statistics;
CREATE POLICY "Authenticated users can read statistics"
    ON erp_statistics
    FOR SELECT
    TO authenticated
    USING (true);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS status for all tables
-- Run this to verify RLS is disabled:
/*
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('erp_permits', 'erp_permit_changes', 'erp_statistics')
ORDER BY tablename;
*/

-- Check existing policies (should be empty for disabled RLS tables)
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('erp_permits', 'erp_permit_changes', 'erp_statistics')
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- Why disable RLS for erp_permits?
-- 1. Public government data - no sensitive information
-- 2. All authenticated users need read access
-- 3. ETL service needs write access
-- 4. No user-specific row filtering needed
-- 5. Simpler and more performant than policies

-- Security remains through:
-- 1. Supabase service role key (kept secret)
-- 2. Authenticated access for user-specific tables (user_profiles, user_bookmarks)
-- 3. API-level access controls in frontend

-- User-specific tables (user_profiles, user_bookmarks, alert_rules, etc.)
-- still have RLS enabled and proper policies.

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback this migration and re-enable RLS:
/*
ALTER TABLE erp_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_permit_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_statistics ENABLE ROW LEVEL SECURITY;
*/
