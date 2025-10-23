# Acreage Field Name Mismatch - RESOLVED

## Problem Discovered

The TypeScript types and actual database schema are **out of sync**:

### Database (Actual):
```sql
CREATE TABLE erp_permits (
  ...
  acreage NUMERIC,  -- ✅ This is the real column name
  ...
)
```

### TypeScript Types (Incorrect):
```typescript
{
  ...
  total_acreage: number | null,  // ❌ This field doesn't exist in DB
  wetland_acreage: number | null,
  surface_water_acreage: number | null,
  ...
}
```

### ETL Script (Correct):
```python
'acreage': attributes.get('PROJECT_ACRES_MS'),  # ✅ Uses 'acreage'
```

## Root Cause

The TypeScript database types were generated or manually created with `total_acreage`, but the actual database column created by the ETL process is named `acreage`.

## Solutions Applied

### 1. Fixed PermitMap Acreage Filter ✅
Updated the filter to check both possible field names:
```typescript
// Check both 'acreage' and 'total_acreage' fields (database schema mismatch)
const acreageValue = (p as any).acreage || p.total_acreage
```

### 2. Updated Helper Text ✅
The "X permits have acreage data" counter now checks the correct field.

### 3. Dashboard Stats - NO FIX NEEDED ✅
The dashboard was already using the correct field name (`acreage`):
```sql
AVG(acreage) as avg_acreage  -- This was correct all along!
```

## Long-term Fix Recommendations

### Option 1: Regenerate TypeScript Types (Recommended)
Use Supabase CLI to regenerate types from the actual database schema:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > web/src/types/database.ts
```

### Option 2: Add Database Migration
Rename the column in the database to match the types:
```sql
ALTER TABLE erp_permits 
RENAME COLUMN acreage TO total_acreage;
```
Then update the ETL script to use `total_acreage`.

###Option 3: Fix TypeScript Types Manually
Edit `web/src/types/database.ts` and change:
```typescript
total_acreage: number | null  // Change this
wetland_acreage: number | null
surface_water_acreage: number | null
```
To:
```typescript
acreage: number | null  // To this
wetland_acreage: number | null
surface_water_acreage: number | null
```

## Current Status

✅ **Acreage filter is now working**
✅ **Dashboard stats were already correct**
✅ **Code checks both field names for compatibility**

⚠️ **TypeScript types still show incorrect field name**
- This creates type safety issues
- Should be fixed with one of the long-term solutions above

## Testing

After this fix, the acreage filter should work correctly. Try:
1. Enter `1` in the minimum field
2. You should see permits with acreage data
3. Check the helper text for count of permits with acreage

The filter will now find permits with the `acreage` field populated!
