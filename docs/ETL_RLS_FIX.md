# ETL Pipeline RLS Fix

## Problem

The ETL pipeline is failing with this error:
```
Failed to upsert permits: {'message': 'new row violates row-level security policy for table "erp_permits"', 'code': '42501'}
```

## Root Cause

Row-Level Security (RLS) is enabled on the `erp_permits` table, but there are no policies allowing the service role (used by the ETL) to INSERT or UPDATE records.

The GitHub Actions ETL pipeline uses the Supabase service role key to authenticate, but RLS is blocking write operations even with that key.

## Solution

Since `erp_permits` contains public government data (Environmental Resource Permits from SWFWMD), there's no need for row-level security. All authenticated users should be able to read all permits, and the ETL service needs unrestricted write access.

**We're disabling RLS on the three ETL-managed tables:**
- `erp_permits` - Main permit data
- `erp_permit_changes` - Change history
- `erp_statistics` - Daily aggregated stats

User-specific tables (`user_profiles`, `user_bookmarks`, `alert_rules`, etc.) will keep RLS enabled with proper policies.

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **+ New Query**
4. Copy the contents of `database/migrations/008_fix_etl_rls_policy.sql`
5. Paste into the SQL editor
6. Click **Run** (or press `Cmd/Ctrl + Enter`)
7. Verify success message

### Option 2: Command Line (via Supabase CLI)

```bash
# If you have Supabase CLI installed and linked to your project
supabase db push

# Or run the migration directly
supabase db execute --file database/migrations/008_fix_etl_rls_policy.sql
```

### Option 3: Direct psql Connection

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Run the migration
\i database/migrations/008_fix_etl_rls_policy.sql
```

## Verification

After applying the migration, verify RLS is disabled:

```sql
-- Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('erp_permits', 'erp_permit_changes', 'erp_statistics')
ORDER BY tablename;
```

Expected result: `rls_enabled` should be `false` for all three tables.

## Test the ETL

After applying the fix, trigger a manual ETL run:

1. Go to GitHub: `https://github.com/kmazur-FLDP/PermitIQ/actions`
2. Click on **Daily ETL Pipeline** workflow
3. Click **Run workflow** button
4. Select branch: `main`
5. Leave "Dry Run" unchecked (to test actual database write)
6. Click **Run workflow**

The ETL should now complete successfully without the RLS error.

## Why This is Safe

1. **Public Data**: ERP permits are public government records with no sensitive information
2. **Authentication Still Required**: Users must be authenticated to access the frontend
3. **User Tables Protected**: User-specific tables (`user_profiles`, `user_bookmarks`) still have RLS enabled
4. **Service Role Security**: The Supabase service role key used by ETL is stored securely in GitHub Secrets
5. **No Data Exposure**: Frontend uses authenticated API calls; anonymous users can't directly query the database

## Alternative Approach

If you prefer to keep RLS enabled for audit purposes, the migration file includes commented-out policies that allow:
- Service role: Full access (for ETL)
- Authenticated users: Read-only access
- Anonymous users: Read-only access

To use this approach, uncomment the section marked "ALTERNATIVE APPROACH" in `008_fix_etl_rls_policy.sql`.

## What Changed

### Before (Broken)
```
erp_permits table:
  - RLS: Enabled
  - Policies: None
  - Result: ETL cannot write → Pipeline fails ❌
```

### After (Fixed)
```
erp_permits table:
  - RLS: Disabled
  - Policies: N/A (not needed when RLS disabled)
  - Result: ETL can write → Pipeline succeeds ✅
```

## Rollback

If you need to rollback and re-enable RLS:

```sql
ALTER TABLE erp_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_permit_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_statistics ENABLE ROW LEVEL SECURITY;
```

Then create appropriate policies for service role access.

## Next Steps

1. ✅ Apply the migration (run the SQL file)
2. ✅ Verify RLS is disabled (run verification query)
3. ✅ Test ETL pipeline (trigger manual workflow run)
4. ✅ Monitor next automatic run (tomorrow at 7 AM EST)

---

**Migration File**: `database/migrations/008_fix_etl_rls_policy.sql`  
**Issue**: ETL failing with RLS policy violation  
**Fix**: Disable RLS on public permit tables  
**Date**: October 24, 2025
