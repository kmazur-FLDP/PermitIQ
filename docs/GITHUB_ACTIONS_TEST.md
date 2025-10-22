# GitHub Actions Test Guide

## 🧪 Testing Your GitHub Actions Workflow

Follow these steps to verify your GitHub Actions automation is working correctly.

---

## Step 1: Navigate to GitHub Actions

1. Go to: **https://github.com/kmazur-FLDP/PermitIQ/actions**
2. You should see the "Daily ETL Pipeline" workflow listed

---

## Step 2: Manually Trigger a Test Run

1. Click on **"Daily ETL Pipeline"** in the left sidebar
2. You'll see a **"Run workflow"** button on the right side
3. Click the **"Run workflow"** dropdown
4. Ensure `main` branch is selected
5. Click the green **"Run workflow"** button

---

## Step 3: Monitor the Execution

### What You'll See:

1. **Queued**: Workflow is waiting to start (usually 1-5 seconds)
2. **In Progress**: Yellow dot 🟡 means it's running
3. **Success**: Green checkmark ✅ means everything worked!
4. **Failure**: Red X ❌ means something went wrong

### Typical Execution Timeline:
- **0:00-0:10** - Setting up Python environment
- **0:10-0:20** - Installing dependencies
- **0:20-3:00** - Running ETL pipeline (fetching 105k records)
- **3:00-3:30** - Uploading to Supabase
- **3:30-4:00** - Calculating statistics

**Expected Total Time**: 3-5 minutes

---

## Step 4: View Detailed Logs

1. Click on the workflow run (it will have a name like "Daily ETL Pipeline #1")
2. Click on the job name: **"run-etl"**
3. Expand each step to see detailed output:
   - ✅ **Set up job** - GitHub Actions environment
   - ✅ **Checkout code** - Downloads your repository
   - ✅ **Set up Python** - Installs Python 3.13
   - ✅ **Install dependencies** - Installs packages from requirements.txt
   - ✅ **Run ETL pipeline** - The main ETL execution
   - ✅ **Post actions** - Cleanup

---

## Step 5: What to Look For in Logs

### ✅ Success Indicators:

```
ETL Run ID: [some-uuid]
Step 1: Fetching data from SWFWMD API
Total records available: 105,298
Fetched 105,298 raw permit records

Step 2: Transforming permit data
Transformed 105,298 permits
After deduplication: 40,382 unique permits

Step 3: Loading data into Supabase
Successfully upserted 40382 permits

Step 4: Calculating daily statistics
HTTP 204 No Content (success)

ETL PIPELINE COMPLETED SUCCESSFULLY
Duration: ~180-200 seconds
```

### ❌ Common Issues and Solutions:

#### Issue: "Secret not found"
```
Error: Secret PERMITIQ_SUPABASE_URL not found
```
**Solution**: 
- Go to Settings → Secrets and variables → Actions
- Verify secret name is EXACTLY: `PERMITIQ_SUPABASE_URL` (case-sensitive)
- Add or update the secret

#### Issue: "401 Unauthorized"
```
Error: Invalid API key
```
**Solution**:
- Verify you're using the **service_role** key (not anon key)
- Get it from: Supabase Dashboard → Settings → API → service_role

#### Issue: "Connection timeout"
```
requests.exceptions.ConnectionError: Failed to establish connection
```
**Solution**:
- SWFWMD API is only available **6 AM - 10 PM EST**
- Try again during operating hours
- Or check API status

#### Issue: "Row Level Security"
```
new row violates row-level security policy
```
**Solution**:
- Ensure you're using service_role key (bypasses RLS)
- Check that all RLS policies have service_role exceptions

---

## Step 6: Verify Data Was Updated

After a successful run, verify in Supabase:

### Option A: Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr/editor
2. Click on **"erp_permits"** table
3. Check the **"updated_at"** column - should show recent timestamps

### Option B: SQL Query
```sql
-- Check latest updates
SELECT 
    COUNT(*) as total_permits,
    MAX(updated_at) as last_update,
    COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 hour') as updated_last_hour
FROM erp_permits;

-- View recent statistics
SELECT * FROM erp_statistics 
ORDER BY stat_date DESC 
LIMIT 5;
```

---

## Step 7: Set Up for Daily Automation

Once the test run succeeds:

### ✅ What Happens Automatically:
- Workflow runs every day at **7:00 AM EST**
- Fetches latest permits from SWFWMD
- Updates database with new/changed permits
- Calculates statistics and hotspot scores
- Sends email if workflow fails

### 📧 Email Notifications:
Configure in GitHub:
1. Go to: https://github.com/settings/notifications
2. Scroll to **"Actions"**
3. Choose notification preference:
   - ✅ **Send notifications for failed workflows only** (recommended)
   - Send notifications for all workflows
   - Don't send notifications

---

## Expected Results

### First Run (Full Update):
- **Duration**: 3-5 minutes
- **Records Fetched**: 105,298 raw permits
- **Records Loaded**: 40,382 unique permits (after deduplication)
- **New Permits**: Depends on API updates since last run

### Subsequent Daily Runs:
- **Duration**: 3-5 minutes (fetches all records each time)
- **Records Fetched**: 105,298+ (as new permits are added)
- **Updates**: Only changed/new permits written to database
- **Performance**: Supabase upsert is efficient (updates only what changed)

---

## Troubleshooting Commands

If the workflow fails, you can debug locally:

```bash
# Navigate to project
cd /Users/kevinmazur/Documents/Kevin\ Work/PermitIQ

# Activate virtual environment
source venv/bin/activate

# Test with dry run (no database writes)
python etl/fetch_permits.py --dry-run

# Run full ETL (writes to database)
python etl/fetch_permits.py

# Check for specific errors
python etl/fetch_permits.py --limit 10  # Test with small batch
```

---

## Next Steps After Successful Test

1. ✅ **Verify daily automation** - Check Actions tab tomorrow after 7 AM EST
2. ✅ **Monitor for a week** - Ensure runs are successful daily
3. ✅ **Add competitors** - Run `scripts/add_sample_competitors.sql`
4. ✅ **Set up alerts** - Configure alert rules for competitor activity
5. ✅ **Update ETL** - Add revision history tracking (optional)

---

## Quick Reference Links

- **GitHub Actions**: https://github.com/kmazur-FLDP/PermitIQ/actions
- **Repository Settings**: https://github.com/kmazur-FLDP/PermitIQ/settings
- **Secrets Management**: https://github.com/kmazur-FLDP/PermitIQ/settings/secrets/actions
- **Supabase Dashboard**: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr
- **Workflow File**: `.github/workflows/daily-etl.yml`

---

## Success Checklist

Before considering GitHub Actions "complete":

- [ ] Secrets configured in GitHub (3 secrets)
- [ ] Manual test run completed successfully
- [ ] Logs show successful ETL execution
- [ ] Supabase data updated with recent timestamps
- [ ] Email notifications configured
- [ ] Daily schedule verified (runs at 7 AM EST)
- [ ] No errors in test run logs

Once all checked, your automation is **production ready**! 🚀

---

**Last Updated**: October 22, 2025  
**Test Status**: Ready to execute  
**Expected Success Rate**: >99% (API availability dependent)
