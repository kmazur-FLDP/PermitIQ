# PermitIQ Database Migrations Summary

## Completed Migrations

### Migration 004: Permit Revision History
**File**: `database/migrations/004_add_permit_history.sql`
**Status**: ✅ Ready to apply
**Purpose**: Track all versions/revisions of permits over time

**Creates**:
- Table: `erp_permit_history`
  - Stores historical snapshots of all permit versions
  - Links to current permit via `permit_id` (BIGINT foreign key)
  - Includes polygon geometry and centroid location for each revision
  - Tracks revision number, captured_at timestamp
  
- Functions (3):
  - `get_permit_revision_history(permit_number)` - Get complete revision history with change detection
  - `find_permits_with_recent_revisions(days_back)` - Find permits revised in last N days
  - `compare_permit_revisions(permit_number, rev1, rev2)` - Compare two specific revisions

**Use Cases**:
- See how project boundaries changed over time
- Track when applicants modified their permits
- Detect scope creep or boundary expansions
- Audit trail for compliance

---

### Migration 005: Competitor Watchlist
**File**: `database/migrations/005_add_competitor_watchlist.sql`
**Status**: ✅ Ready to apply
**Purpose**: Track specific companies/applicants for competitive intelligence

**Creates**:
- Table: `competitor_watchlist`
  - Store companies to monitor (D.R. Horton, Lennar, etc.)
  - Company aliases for fuzzy matching
  - Alert settings (radius, priority level)
  - Statistics (total permits, last permit date)
  
- Table: `competitor_permit_matches`
  - Links permits to watched competitors
  - Match confidence score (exact, alias, fuzzy)
  - Distance to nearest project
  - Alert tracking

- Functions (4):
  - `add_competitor_to_watchlist(company_name, aliases, ...)` - Add competitor with auto-matching
  - `match_competitor_permits(competitor_id)` - Find all matching permits
  - `get_competitor_activity_summary(competitor_id, days_back)` - Activity stats
  - `find_nearby_competitor_activity(lon, lat, radius_miles)` - Spatial search

**Use Cases**:
- Monitor when D.R. Horton files permits near your projects
- Track Lennar's total acreage in each county
- Get alerts when competitors enter new markets
- Analyze competitor activity patterns

**Example Usage**:
```sql
-- Add D.R. Horton to watchlist
SELECT add_competitor_to_watchlist(
    'D.R. Horton',
    ARRAY['DR Horton', 'Horton Homes', 'D R Horton Inc'],
    'direct',
    'high',
    true,
    'kevin@permitiq.com'
);

-- Find their activity
SELECT * FROM get_competitor_activity_summary(1, 90);

-- Find competitors near Tampa
SELECT * FROM find_nearby_competitor_activity(-82.4572, 27.9506, 10.0);
```

---

### Migration 006: Alert Notifications
**File**: `database/migrations/006_add_alert_notifications.sql`
**Status**: ✅ Ready to apply
**Purpose**: Automated alerts for competitor activity and permit changes

**Creates**:
- Table: `alert_notifications`
  - Stores generated alerts (new permits, proximity, revisions)
  - Severity levels (info, warning, critical)
  - Delivery tracking (email, webhook, dashboard)
  - Deduplication to prevent spam
  
- Table: `alert_rules`
  - Configurable alert rules
  - JSON-based parameters for flexibility
  - Rate limiting and cooldown periods
  - Multiple delivery methods

- Functions (4):
  - `create_alert(type, severity, title, message, ...)` - Create alert with deduplication
  - `check_competitor_alert_rules(permit_id)` - Evaluate rules for new permit
  - `get_pending_alerts(severity, limit)` - Get unacknowledged alerts
  - `acknowledge_alert(alert_id, user)` - Mark alert as acknowledged

- Triggers (1):
  - Auto-check alert rules when new competitor match is created

**Use Cases**:
- Email notification when D.R. Horton files permit within 5 miles
- Dashboard alert for permits near your project sites
- Webhook integration with Slack/Teams
- Daily digest of competitor activity

**Example Alert Rules**:
```sql
-- Alert when competitors file within 5 miles of headquarters
INSERT INTO alert_rules (rule_name, rule_type, parameters, alert_severity, delivery_methods)
VALUES (
    'Tampa HQ Radius Alert',
    'permit_near_location',
    '{"location": {"lat": 27.9506, "lon": -82.4572}, "radius_miles": 5}',
    'warning',
    ARRAY['email', 'dashboard']
);
```

---

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr
2. Navigate to **SQL Editor**
3. Copy the entire contents of each migration file (004, 005, 006)
4. Paste into SQL Editor
5. Click **Run** for each migration
6. Verify "Migration XXX completed successfully" message appears

### Option 2: psql CLI
```bash
# Set your database password
export PGPASSWORD='your-password-here'

# Apply migrations
psql 'postgresql://postgres@db.lqiglujleojwkcwfbxmr.supabase.co:5432/postgres' \
  -f database/migrations/004_add_permit_history.sql

psql 'postgresql://postgres@db.lqiglujleojwkcwfbxmr.supabase.co:5432/postgres' \
  -f database/migrations/005_add_competitor_watchlist.sql

psql 'postgresql://postgres@db.lqiglujleojwkcwfbxmr.supabase.co:5432/postgres' \
  -f database/migrations/006_add_alert_notifications.sql
```

### Option 3: Python Migration Runner (Helper)
```bash
cd /Users/kevinmazur/Documents/Kevin\ Work/PermitIQ
source venv/bin/activate
python database/run_migrations.py --all
```
*Note: This script provides instructions but doesn't execute directly. Use Options 1 or 2 for actual execution.*

---

## Next Steps After Migrations

### 1. Update ETL Pipeline (TODO #6)
Modify `etl/fetch_permits.py` to:
- Insert ALL permit versions into `erp_permit_history` before deduplication
- Track revision numbers properly
- Link history records to current permit via `permit_id`

### 2. Add Sample Competitors
```sql
-- Add your top 3 competitors
SELECT add_competitor_to_watchlist('D.R. Horton', ARRAY['DR Horton', 'Horton Homes'], 'direct', 'high', true, 'system');
SELECT add_competitor_to_watchlist('Lennar Homes', ARRAY['Lennar', 'Lennar Corporation'], 'direct', 'high', true, 'system');
SELECT add_competitor_to_watchlist('Pulte Group', ARRAY['Pulte Homes', 'Centex'], 'direct', 'medium', true, 'system');
```

### 3. Configure Alert Rules
Create rules for your specific use cases (proximity alerts, new permits, etc.)

### 4. Test Spatial Analysis Functions
```sql
-- Test competitor proximity
SELECT * FROM find_nearby_competitor_activity(-82.4572, 27.9506, 10.0);

-- Check recent competitor activity
SELECT * FROM get_competitor_activity_summary(1, 90);

-- View pending alerts
SELECT * FROM get_pending_alerts('warning', 10);
```

---

## Schema Changes Summary

All new tables use **BIGINT** for IDs to match existing `erp_permits` table:
- ✅ `erp_permit_history.id` → BIGSERIAL
- ✅ `erp_permit_history.permit_id` → BIGINT (FK to erp_permits)
- ✅ `competitor_watchlist.id` → BIGSERIAL
- ✅ `competitor_permit_matches.id` → BIGSERIAL
- ✅ `competitor_permit_matches.competitor_id` → BIGINT (FK to competitor_watchlist)
- ✅ `competitor_permit_matches.permit_id` → BIGINT (FK to erp_permits)
- ✅ `alert_notifications.id` → BIGSERIAL
- ✅ `alert_notifications.competitor_id` → BIGINT (FK to competitor_watchlist)
- ✅ `alert_notifications.permit_id` → BIGINT (FK to erp_permits)
- ✅ `alert_rules.id` → BIGSERIAL

All function return types and parameters updated to use BIGINT instead of UUID.

---

## Questions or Issues?

- **Foreign Key Errors**: Fixed! All tables now use BIGINT to match erp_permits.id
- **Row Level Security**: All tables have RLS enabled with policies for authenticated users and service role
- **Indexes**: All spatial indexes (GIST) and regular indexes created with IF NOT EXISTS
- **Validation**: Each migration includes DO block to verify successful creation

Ready to apply! 🚀
