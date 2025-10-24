# ETL Duplicate ObjectID Fix

## Problem

The ETL pipeline is now failing with a different error:

```
duplicate key value violates unique constraint "erp_permits_objectid_key"
Details: Key (objectid)=(8) already exists.
```

## Root Cause

The database schema has a UNIQUE constraint on the `objectid` column:

```sql
objectid INTEGER UNIQUE,  -- SWFWMD's internal object ID
```

However, the SWFWMD API source data contains **duplicate `objectid` values** for different permits. This means `objectid` is NOT actually a unique identifier in the real-world data.

The **true unique identifier** is `permit_number`, which the ETL correctly uses for upsert conflict resolution:

```python
.upsert(batch, on_conflict='permit_number')
```

But PostgreSQL enforces the UNIQUE constraint on `objectid` during INSERT, causing the failure before the conflict resolution logic even runs.

## Solution

Remove the UNIQUE constraint from `objectid` and keep it as a regular indexed column.

### Quick Fix (Run in Supabase SQL Editor)

```sql
-- Remove UNIQUE constraint
ALTER TABLE erp_permits 
    DROP CONSTRAINT IF EXISTS erp_permits_objectid_key;

-- Drop auto-created unique index
DROP INDEX IF EXISTS erp_permits_objectid_key;

-- Create regular (non-unique) index for performance
CREATE INDEX IF NOT EXISTS idx_erp_permits_objectid ON erp_permits(objectid);
```

### Or Apply Full Migration

Run the complete migration file: `database/migrations/009_remove_objectid_unique_constraint.sql`

## Verification

After applying the fix, verify the constraint is removed:

```sql
-- Check constraints (should show NO objectid constraint)
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'erp_permits'::regclass
    AND conname LIKE '%objectid%';

-- Check for existing duplicate objectid values
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
```

## Why This is Correct

1. **permit_number is the official unique ID** from SWFWMD - this is what we should rely on
2. **objectid is an internal field** that SWFWMD may reuse across different permits
3. **The API doesn't guarantee objectid uniqueness** - the real-world data proves this
4. **Performance is maintained** - we still have a regular index on objectid for fast lookups
5. **ETL uses permit_number for conflict resolution** - this is already correct

## What Changed

### Before (Broken)
```
Schema:
  permit_number: UNIQUE ✓ (correct)
  objectid: UNIQUE ✗ (incorrect assumption)

Result: 
  ETL fails when SWFWMD data has duplicate objectid values
```

### After (Fixed)
```
Schema:
  permit_number: UNIQUE ✓ (correct, primary identifier)
  objectid: INDEXED (non-unique) ✓ (matches real data)

Result:
  ETL succeeds, allows duplicate objectid values
  Upserts based on permit_number (correct behavior)
```

## Impact on Queries

- **No impact on permit_number lookups** - still unique, still fast
- **objectid lookups may return multiple records** - which matches reality
- **Index still exists** - objectid queries are still performant
- **All existing queries continue to work** - just more accurate to source data

## Steps to Fix

1. ✅ Go to Supabase SQL Editor
2. ✅ Run the 3 SQL commands above (or full migration file)
3. ✅ Verify constraint is removed
4. ✅ Trigger manual ETL run on GitHub Actions
5. ✅ Confirm ETL completes successfully
6. ✅ Monitor tomorrow's automatic 7 AM run

---

**Migration File**: `database/migrations/009_remove_objectid_unique_constraint.sql`  
**Issue**: ETL failing with duplicate objectid constraint violation  
**Fix**: Remove UNIQUE constraint on objectid (not actually unique in source data)  
**Date**: October 24, 2025

## Next ETL Run

After applying this fix, the next ETL run should complete successfully. The pipeline will:
- Fetch all 105,342 records from SWFWMD API ✓
- Transform and deduplicate to 40,388 unique permits ✓  
- Upsert based on permit_number (allowing duplicate objectid) ✓
- Complete without constraint violations ✓
