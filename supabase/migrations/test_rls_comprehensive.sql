-- Comprehensive test of RLS and data access

-- 1. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'erp_permits';

-- 2. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'erp_permits';

-- 3. Test direct query as postgres (should work)
SELECT county, COUNT(*) as count
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY count DESC
LIMIT 10;

-- 4. Test as authenticated user (might be blocked by RLS)
SET ROLE authenticated;
SELECT county, COUNT(*) as count
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY count DESC
LIMIT 10;
RESET ROLE;

-- 5. If RLS is blocking, temporarily disable it to test
ALTER TABLE erp_permits DISABLE ROW LEVEL SECURITY;

-- 6. Test function again
SELECT * FROM get_dashboard_county_stats();

-- 7. Re-enable RLS
ALTER TABLE erp_permits ENABLE ROW LEVEL SECURITY;

-- 8. Create policy to allow all reads for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read all permits" ON erp_permits;
CREATE POLICY "Allow authenticated users to read all permits" 
ON erp_permits 
FOR SELECT 
TO authenticated 
USING (true);

-- 9. Test function again
SELECT * FROM get_dashboard_county_stats();
