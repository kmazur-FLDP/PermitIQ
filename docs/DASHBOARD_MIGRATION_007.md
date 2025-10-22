# Dashboard Performance Fix - Migration Guide

## Problem
The dashboard was trying to aggregate 40,000+ permits in real-time on every page load, causing:
- Blank charts
- Slow loading times
- High database load

## Solution
Created materialized views that pre-calculate all statistics at the database level.

## Steps to Apply

### 1. Run the Migration in Supabase

1. **Go to Supabase SQL Editor**:
   - URL: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr/sql

2. **Create a new query** and paste the contents of:
   ```
   supabase/migrations/007_dashboard_statistics_views.sql
   ```

3. **Run the query** - This will:
   - Create 5 materialized views for dashboard stats
   - Create indexes for performance
   - Create a function to refresh the views
   - Grant permissions to authenticated users
   - Initially populate the views

4. **Verify the views were created**:
   ```sql
   SELECT * FROM dashboard_overall_stats;
   SELECT * FROM dashboard_county_stats LIMIT 10;
   SELECT * FROM dashboard_status_stats;
   SELECT * FROM dashboard_applicant_stats LIMIT 10;
   SELECT * FROM dashboard_monthly_trends;
   ```

### 2. Test the Dashboard

1. **Refresh the dashboard page**: http://localhost:3000/dashboard
2. **You should now see**:
   - All metrics populated (Total Permits, Last 30 Days, Top County, Avg. Acreage)
   - County bar chart with data
   - Status pie chart with data
   - Monthly trend line chart
   - Top applicants horizontal bar chart

### 3. Update the ETL Script (Optional but Recommended)

To keep the statistics fresh, add this to your ETL script after data updates:

**File**: `scripts/etl_permits.py`

Add after the main ETL process:

```python
def refresh_dashboard_stats(conn):
    """Refresh materialized views for dashboard"""
    cursor = conn.cursor()
    cursor.execute("SELECT refresh_dashboard_stats();")
    conn.commit()
    cursor.close()
    logging.info("Refreshed dashboard statistics")

# In your main() function, after updating permits:
refresh_dashboard_stats(conn)
```

### 4. Performance Notes

**Materialized Views**:
- Pre-calculated aggregations stored in the database
- **Much faster** than runtime calculations (milliseconds vs seconds)
- Need to be refreshed periodically to show new data

**Refresh Strategy**:
- Manual: Run `SELECT refresh_dashboard_stats();` in SQL Editor
- Automated: Add to ETL cron job (runs daily at 7 AM)
- On-demand: Call from admin panel (future feature)

**Query Performance**:
- **Before**: ~3-5 seconds to aggregate 40k+ records
- **After**: ~50-100ms to read pre-calculated views

### 5. Troubleshooting

**If charts are still blank**:

1. Check if views exist:
   ```sql
   SELECT schemaname, matviewname 
   FROM pg_matviews 
   WHERE matviewname LIKE 'dashboard%';
   ```

2. Check if views have data:
   ```sql
   SELECT COUNT(*) FROM dashboard_county_stats;
   ```

3. Manually refresh views:
   ```sql
   SELECT refresh_dashboard_stats();
   ```

4. Check browser console for errors

**If you see permission errors**:
```sql
GRANT SELECT ON dashboard_county_stats TO authenticated;
GRANT SELECT ON dashboard_status_stats TO authenticated;
GRANT SELECT ON dashboard_applicant_stats TO authenticated;
GRANT SELECT ON dashboard_monthly_trends TO authenticated;
GRANT SELECT ON dashboard_overall_stats TO authenticated;
```

### 6. Future Enhancements

Consider adding:
- Real-time refresh button in dashboard UI
- Scheduled refresh via Supabase Edge Functions
- Incremental updates instead of full refresh
- Additional aggregations (permit types, hotspot analysis)

## Technical Details

**Materialized Views Created**:
1. `dashboard_overall_stats` - Total counts, averages, top county
2. `dashboard_county_stats` - Permits per county with averages
3. `dashboard_status_stats` - Permit count by status
4. `dashboard_applicant_stats` - Top 50 applicants
5. `dashboard_monthly_trends` - Last 24 months of activity

**Indexes Added**:
- `idx_dashboard_county_stats_county`
- `idx_dashboard_applicant_stats`

**Function Created**:
- `refresh_dashboard_stats()` - Refreshes all 5 views at once
