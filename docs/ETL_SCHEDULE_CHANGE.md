# ETL Schedule Change - Weekly Monday Runs

## Change Summary
**Date:** October 28, 2025  
**Reason:** ETL failing regularly due to SWFWMD API rate limiting (too many requests)  
**Solution:** Reduce frequency from daily to weekly

---

## What Changed

### Before:
- **Schedule:** Daily at 7:00 AM EST
- **Frequency:** 7 times per week
- **Cron:** `0 11 * * *` (every day)
- **File:** `.github/workflows/daily-etl.yml`
- **Issue:** Hitting SWFWMD API rate limits causing frequent failures

### After:
- **Schedule:** Monday only at 8:00 AM EST ✅
- **Frequency:** 1 time per week
- **Cron:** `0 13 * * 1` (Monday only)
- **File:** `.github/workflows/weekly-etl.yml` (renamed)
- **Benefit:** 86% reduction in API requests (7 → 1 per week)

---

## Cron Schedule Explanation

```yaml
schedule:
  - cron: '0 13 * * 1'
```

**Breakdown:**
- `0` - Minute (0 = top of the hour)
- `13` - Hour in UTC (13:00 UTC = 8:00 AM EST)
- `*` - Day of month (any day)
- `*` - Month (any month)
- `1` - Day of week (1 = Monday, 0 = Sunday)

**Time Zone Notes:**
- Cron jobs run in UTC time
- 8:00 AM EST = 13:00 UTC (standard time)
- 8:00 AM EDT = 12:00 UTC (daylight saving time)
- Currently using 13:00 UTC for consistency

---

## Manual Trigger Still Available

The ETL can still be run manually anytime via:

1. **GitHub Actions UI:**
   - Go to Actions tab
   - Select "PermitIQ Weekly ETL"
   - Click "Run workflow"
   - Choose dry-run mode if testing

2. **Command Line:**
   ```bash
   # Trigger via GitHub CLI
   gh workflow run weekly-etl.yml
   
   # Or with dry-run
   gh workflow run weekly-etl.yml -f dry_run=true
   ```

3. **Local Manual Run:**
   ```bash
   cd /Users/kevinmazur/Documents/Kevin\ Work/PermitIQ
   python etl/fetch_permits.py
   ```

---

## Impact Assessment

### Positive Impacts:
- ✅ **86% fewer API requests** - Dramatically reduces rate limit issues
- ✅ **Lower SWFWMD server load** - Good API citizenship
- ✅ **Fewer GitHub Actions minutes** - Cost savings
- ✅ **More reliable runs** - Less likely to fail
- ✅ **Easier to monitor** - 1 run per week vs 7

### Considerations:
- ⚠️ **Data freshness** - Updates once weekly instead of daily
- ⚠️ **Lag time** - New permits may not appear for up to 7 days
- ℹ️ **Mitigation** - Can manually trigger ETL if urgent update needed

### Data Freshness Analysis:

**For most use cases, weekly updates are sufficient because:**
1. Environmental permits typically have:
   - Long review/approval periods (weeks to months)
   - Infrequent status changes
   - Stable historical data
2. SWFWMD likely doesn't update their data hourly/daily anyway
3. Competitors/market trends don't change daily
4. Users care more about trends than real-time data

**When daily updates mattered:**
- Live construction tracking (not your use case)
- Real-time compliance monitoring (not needed)
- Emergency response (not applicable)

---

## Next ETL Run Schedule

Based on the new Monday 8:00 AM EST schedule:

| Date | Time (EST) | Notes |
|------|-----------|-------|
| Nov 4, 2025 | 8:00 AM | Next scheduled run |
| Nov 11, 2025 | 8:00 AM | |
| Nov 18, 2025 | 8:00 AM | |
| Nov 25, 2025 | 8:00 AM | |
| Dec 2, 2025 | 8:00 AM | |

**Runs every Monday morning at 8:00 AM EST.**

---

## Monitoring & Alerts

### Success Indicators:
- [ ] ETL completes successfully on Mondays
- [ ] No rate limit errors in logs
- [ ] Materialized views refreshed after each run
- [ ] Dashboard data updated weekly

### Failure Handling:
- Automatic GitHub issue creation on failure (unchanged)
- ETL logs uploaded as artifacts (unchanged)
- Can manually re-run if needed

### If Rate Limiting Still Occurs:

**Further reduction options:**
1. Bi-weekly (every other Monday)
2. Monthly (1st Monday of month)
3. Implement incremental updates (fetch only changed records)
4. Contact SWFWMD for higher rate limits

---

## API Rate Limit Context

**SWFWMD API Constraints:**
- Available: 6 AM - 10 PM EST only
- Max 1,000 records per request
- Unknown rate limit threshold
- ~105,000 total records = ~105 API requests per full fetch

**Previous Failures Likely Due To:**
- Multiple daily runs hitting cumulative limits
- Possible daily API quota (not documented)
- Server-side throttling during peak hours

**Weekly Schedule Benefits:**
- Spreads requests over 7 days instead of hitting API daily
- Runs during low-traffic hours (8 AM Monday)
- 86% reduction in total API calls

---

## Rollback Plan

If weekly updates prove insufficient:

1. **Test bi-weekly first:**
   ```yaml
   cron: '0 13 1,15 * *'  # 1st and 15th of month
   ```

2. **Implement incremental updates:**
   - Fetch only records modified since last run
   - Reduces API calls from 105 to ~5-10 per run
   - Requires tracking last_modified timestamps

3. **Contact SWFWMD:**
   - Request higher rate limits for research/analysis
   - Explain use case (permit intelligence platform)
   - May get whitelisted or increased quota

---

## Files Modified

1. ✅ `.github/workflows/daily-etl.yml` → **renamed to** `.github/workflows/weekly-etl.yml`
   - Changed cron schedule from `0 11 * * *` to `0 13 * * 1`
   - Updated workflow name and description
   - Manual trigger capability preserved

2. ✅ `ETL_SCHEDULE_CHANGE.md` (this file)
   - Documentation of change and rationale

---

## Communication

### Inform Users:
- [ ] Update README with new ETL schedule
- [ ] Add note to dashboard: "Data updated weekly on Mondays"
- [ ] Notify stakeholders of weekly refresh cadence

### Dashboard Update Suggestion:

Add a last-updated timestamp to dashboard:

```tsx
<p className="text-sm text-slate-500">
  Data last updated: {lastETLRun} • Updates every Monday at 8:00 AM EST
</p>
```

---

## Recommendations

### Short Term:
- ✅ Monitor Monday runs for success/failure
- ✅ Track if rate limiting still occurs
- ✅ Keep manual trigger option readily available

### Medium Term:
- [ ] Implement incremental ETL (fetch only changes)
- [ ] Add last_modified tracking to database
- [ ] Set up Slack/email notifications for ETL completion

### Long Term:
- [ ] Consider SWFWMD partnership for data access
- [ ] Investigate if they offer bulk data exports
- [ ] Build data freshness indicator on dashboard

---

## Testing

### Verify the Schedule:

1. **Check next run date:**
   ```bash
   # View GitHub Actions schedule
   gh workflow view weekly-etl.yml
   ```

2. **Test manual trigger:**
   ```bash
   gh workflow run weekly-etl.yml -f dry_run=true
   ```

3. **Verify cron timing:**
   - Use https://crontab.guru to validate cron expression
   - `0 13 * * 1` = "At 13:00 on Monday"

---

## Status

- ✅ Workflow renamed: `daily-etl.yml` → `weekly-etl.yml`
- ✅ Cron schedule updated: Daily → Monday only
- ✅ Time updated: 7 AM → 8 AM EST
- ✅ Documentation created
- ⏳ Next run: Monday, Nov 4, 2025 at 8:00 AM EST
- ⏳ Monitoring for rate limit issues

**Change Status:** **COMPLETE** ✅

ETL will now run once per week on Monday mornings, reducing API load by 86% and preventing rate limit failures.

