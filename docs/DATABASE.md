# PermitIQ - Database Schema Documentation

## Overview

PermitIQ uses PostgreSQL with PostGIS extension for spatial data analysis. The database is hosted on Supabase.

---

## Extensions

- **PostGIS**: Spatial data types and functions
- **uuid-ossp**: UUID generation
- **pg_trgm**: Fuzzy text search (trigram matching)

---

## Tables

### `erp_permits`

Main table storing Environmental Resource Permit data from SWFWMD.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key (auto-increment) |
| `permit_number` | VARCHAR(50) | Official permit number (UNIQUE) |
| `objectid` | INTEGER | SWFWMD's internal object ID (UNIQUE) |
| `applicant_name` | VARCHAR(500) | Applicant/owner name |
| `company_name` | VARCHAR(500) | Company name (if applicable) |
| `permit_type` | VARCHAR(100) | Type of permit |
| `permit_status` | VARCHAR(50) | Current status |
| `activity_description` | TEXT | Description of permitted activity |
| `application_date` | DATE | When permit was applied for |
| `issue_date` | DATE | When permit was issued |
| `expiration_date` | DATE | Permit expiration date |
| `last_modified_date` | TIMESTAMP WITH TIME ZONE | Last modified by SWFWMD |
| `county` | VARCHAR(100) | County name |
| `city` | VARCHAR(200) | City name |
| `address` | TEXT | Project address |
| `geometry` | GEOMETRY(Point, 4326) | PostGIS point geometry (WGS84) |
| `latitude` | DECIMAL(10, 8) | Latitude |
| `longitude` | DECIMAL(11, 8) | Longitude |
| `project_name` | VARCHAR(500) | Project name |
| `project_type` | VARCHAR(200) | Type of project |
| `acreage` | DECIMAL(10, 2) | Project acreage |
| `created_at` | TIMESTAMP WITH TIME ZONE | Record created timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Record updated timestamp |
| `data_source` | VARCHAR(100) | Source (always 'SWFWMD_API') |
| `raw_data` | JSONB | Full API response (for reference) |

**Indexes:**
- Primary key on `id`
- Unique indexes on `permit_number`, `objectid`
- B-tree indexes on `applicant_name`, `company_name`, `county`, `permit_status`, `issue_date`, `updated_at`
- GIST index on `geometry` for spatial queries
- GIN index for full-text search on names

---

### `erp_permit_changes`

Tracks changes to permit records over time for competitive intelligence.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `permit_id` | BIGINT | FK to erp_permits.id |
| `permit_number` | VARCHAR(50) | Permit number |
| `change_type` | VARCHAR(20) | 'created', 'updated', or 'deleted' |
| `change_detected_at` | TIMESTAMP WITH TIME ZONE | When change was detected |
| `changed_fields` | JSONB | Array of field names that changed |
| `old_values` | JSONB | Previous values |
| `new_values` | JSONB | New values |
| `permit_snapshot` | JSONB | Full permit data at time of change |
| `etl_run_id` | UUID | Links to specific ETL execution |
| `notes` | TEXT | Optional notes |

**Indexes:**
- Primary key on `id`
- B-tree indexes on `permit_id`, `permit_number`, `change_detected_at`, `change_type`, `etl_run_id`

---

### `erp_statistics`

Daily aggregated metrics for trend analysis and hotspot detection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `stat_date` | DATE | Date for statistics |
| `county` | VARCHAR(100) | County name |
| `city` | VARCHAR(200) | City name (NULL for county-level) |
| `total_permits` | INTEGER | Total permits for location |
| `new_permits` | INTEGER | New permits on this date |
| `modified_permits` | INTEGER | Modified permits on this date |
| `active_permits` | INTEGER | Currently active permits |
| `expired_permits` | INTEGER | Expired permits |
| `total_acreage` | DECIMAL(12, 2) | Total acreage |
| `avg_acreage` | DECIMAL(10, 2) | Average acreage |
| `permits_vs_30day_avg` | DECIMAL(5, 2) | % vs 30-day average |
| `permits_vs_90day_avg` | DECIMAL(5, 2) | % vs 90-day average |
| `growth_rate` | DECIMAL(5, 2) | Month-over-month growth |
| `hotspot_score` | DECIMAL(3, 1) | Calculated hotspot score (0-10) |
| `created_at` | TIMESTAMP WITH TIME ZONE | Record created timestamp |

**Unique Constraint:** `(stat_date, county, city)`

**Indexes:**
- Primary key on `id`
- B-tree indexes on `stat_date`, `county`, `hotspot_score`

---

### `user_profiles`

Extended user information linked to Supabase auth.users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, FK to auth.users.id |
| `email` | VARCHAR(255) | User email (UNIQUE) |
| `full_name` | VARCHAR(255) | Full name |
| `role` | VARCHAR(20) | 'admin' or 'user' |
| `default_county` | VARCHAR(100) | Default county for filtering |
| `notification_preferences` | JSONB | Notification settings |
| `created_at` | TIMESTAMP WITH TIME ZONE | Account created |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last updated |
| `last_login_at` | TIMESTAMP WITH TIME ZONE | Last login time |

**RLS Enabled**: Users can only view/edit their own profile.

---

### `user_bookmarks`

User-saved permits for tracking competitors or projects.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `user_id` | UUID | FK to user_profiles.id |
| `permit_id` | BIGINT | FK to erp_permits.id |
| `notes` | TEXT | User notes |
| `tags` | VARCHAR(50)[] | Array of tags |
| `created_at` | TIMESTAMP WITH TIME ZONE | Bookmark created |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last updated |

**Unique Constraint:** `(user_id, permit_id)`

**RLS Enabled**: Users can only view/edit their own bookmarks.

---

## Views

### `recent_permit_activity`

Permits with activity in the last 30 days.

```sql
SELECT 
    p.*,
    CASE 
        WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN 'new'
        WHEN p.updated_at >= NOW() - INTERVAL '30 days' THEN 'updated'
        ELSE 'stable'
    END AS activity_status
FROM erp_permits p
WHERE p.created_at >= NOW() - INTERVAL '30 days'
   OR p.updated_at >= NOW() - INTERVAL '30 days'
```

### `active_hotspots`

Locations with hotspot score ≥ 5.0 in the last 7 days.

```sql
SELECT *
FROM erp_statistics
WHERE hotspot_score >= 5.0
  AND stat_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY hotspot_score DESC
```

---

## Functions

### Spatial Analysis

#### `find_permits_near_point(lng, lat, radius_meters)`

Find permits within a radius of a point.

```sql
SELECT * FROM find_permits_near_point(-82.4572, 27.9506, 1609.34);
-- 1609.34 meters = 1 mile
```

#### `detect_permit_clusters(radius_meters, min_permits)`

Detect geographic clusters using DBSCAN algorithm.

```sql
SELECT * FROM detect_permit_clusters(1609, 5);
-- Find clusters with 5+ permits within 1 mile
```

---

### Change Detection

#### `log_permit_change(permit_number, new_data_jsonb, etl_run_id)`

Compare and log changes to a permit (called by ETL).

---

### Statistics & Hotspots

#### `calculate_daily_statistics(stat_date)`

Calculate aggregated statistics for a date.

```sql
SELECT calculate_daily_statistics(CURRENT_DATE);
```

#### `calculate_hotspot_scores(stat_date)`

Calculate hotspot scores based on trends.

```sql
SELECT calculate_hotspot_scores(CURRENT_DATE);
```

#### `refresh_statistics(days_back)`

Recalculate statistics for recent dates.

```sql
SELECT refresh_statistics(7);  -- Refresh last 7 days
```

---

### Search

#### `search_permits_by_name(search_term, limit_results)`

Fuzzy search by applicant/company/project name.

```sql
SELECT * FROM search_permits_by_name('Pulte', 50);
```

---

### Maintenance

#### `cleanup_old_changes()`

Remove change records older than 2 years.

```sql
SELECT cleanup_old_changes();
```

---

## Row Level Security (RLS)

### user_profiles

- Users can SELECT/UPDATE their own profile
- Policies use `auth.uid() = id`

### user_bookmarks

- Users can SELECT/INSERT/UPDATE/DELETE their own bookmarks
- Policies use `auth.uid() = user_id`

---

## Indexes Strategy

1. **Primary Keys**: Auto-indexed
2. **Foreign Keys**: Indexed for JOIN performance
3. **Search Fields**: B-tree indexes on frequently filtered columns
4. **Spatial**: GIST index on geometry column
5. **Full-text**: GIN index for text search
6. **Time Series**: Indexes on date fields with DESC order

---

## Triggers

### `update_updated_at_column()`

Automatically updates `updated_at` timestamp on UPDATE.

Applied to:
- `erp_permits`
- `user_profiles`
- `user_bookmarks`

---

## Performance Considerations

1. **Spatial Queries**: Use geography cast for accurate distance calculations
2. **Pagination**: Use `LIMIT` and `OFFSET` for large result sets
3. **Indexes**: Monitor slow queries and add indexes as needed
4. **Partitioning**: Consider partitioning `erp_permit_changes` by date if it grows large

---

## Backup Strategy

- **Supabase**: Automatic daily backups
- **Manual**: Use `pg_dump` for custom backups
- **Retention**: Keep change history for 2 years (see cleanup function)

---

## Migration Strategy

1. Run migrations in numbered order
2. Test in development first
3. Backup before production migration
4. Use transactions for safety

---

**Last Updated**: 2025-10-22
