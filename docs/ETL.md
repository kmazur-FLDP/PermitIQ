# PermitIQ - ETL Pipeline Documentation

## Overview

The ETL (Extract, Transform, Load) pipeline fetches Environmental Resource Permit data from the Southwest Florida Water Management District (SWFWMD) ArcGIS API and loads it into Supabase.

---

## Architecture

```
┌─────────────────┐
│  SWFWMD API     │
│  (ArcGIS REST)  │
└────────┬────────┘
         │ HTTP GET
         │ (6AM-10PM EST only)
         │ Max 1000 records/request
         ▼
┌─────────────────┐
│  ETL Pipeline   │
│  (Python)       │
│  - Fetch        │
│  - Transform    │
│  - Detect Δ     │
│  - Load         │
└────────┬────────┘
         │
         │ Supabase Client
         ▼
┌─────────────────┐
│  Supabase       │
│  (PostgreSQL    │
│   + PostGIS)    │
└─────────────────┘
```

---

## Components

### 1. `fetch_permits.py` - Main ETL Script

**Classes:**

#### `SWFWMDAPIClient`

HTTP client for interacting with SWFWMD ArcGIS API.

**Methods:**
- `get_record_count()` → int: Get total available records
- `fetch_permits(offset, limit, where_clause)` → List[Dict]: Fetch single page
- `fetch_all_permits(batch_size)` → List[Dict]: Fetch all records with pagination

**Features:**
- Retry logic for transient failures (3 retries with backoff)
- Automatic pagination handling
- Progress logging

#### `PermitIQETL`

Main ETL orchestrator.

**Methods:**
- `transform_permit(feature)` → Dict: Transform API response to database schema
- `upsert_permits(permits)` → int: Insert or update permits in database
- `run()`: Execute full pipeline

**Features:**
- Dry run mode (no database writes)
- Batch upsert (100 records at a time)
- Change detection integration
- Statistics calculation trigger

---

### 2. `discover_fields.py` - API Discovery Tool

Utility to document actual API field structure.

**Functions:**
- `fetch_sample_permits(api_url, sample_size)`: Fetch sample data
- `analyze_field_structure(features)`: Analyze field names and types
- `analyze_geometry(features)`: Analyze spatial data structure
- `generate_report(...)`: Create JSON report

**Output:** `docs/planning/api_field_discovery.json`

**Usage:**
```bash
python etl/discover_fields.py
```

---

## Data Flow

### Extract Phase

1. **API Connection**
   - Connect to SWFWMD ArcGIS REST API
   - Query endpoint: `/query`
   - Format: JSON (GeoJSON features)

2. **Pagination**
   - API max: 1,000 records per request
   - Get total count first
   - Loop with `resultOffset` parameter
   - Continue until all records fetched

3. **Rate Limiting**
   - Retry on 429, 500, 502, 503, 504 errors
   - 3 retries with exponential backoff
   - 60-second timeout per request

### Transform Phase

1. **Field Mapping**
   - Extract from `features[].attributes`
   - Map to database schema
   - Handle field name variations (e.g., `PERMIT_NUMBER` vs `PermitNumber`)

2. **Geometry Processing**
   - Extract `x`, `y` from `features[].geometry`
   - Create PostGIS WKT: `POINT(longitude latitude)`
   - Store both geometry and separate lat/lng

3. **Date Conversion**
   - Parse ArcGIS timestamps (milliseconds since epoch)
   - Convert to ISO 8601 format
   - Handle null/invalid timestamps gracefully

4. **Data Cleaning**
   - Remove null values
   - Store complete API response in `raw_data` JSONB
   - Validate required fields (permit_number)

### Load Phase

1. **Upsert Strategy**
   - Use Supabase `upsert()` with `on_conflict='permit_number'`
   - Updates existing records, inserts new ones
   - Batch size: 100 records

2. **Change Detection**
   - Compare against existing database records
   - Log changes to `erp_permit_changes` table
   - Track what fields changed and their values

3. **Statistics Calculation**
   - Call `calculate_daily_statistics()` function
   - Call `calculate_hotspot_scores()` function
   - Aggregate by county and date

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PERMITIQ_SUPABASE_URL` | Yes | Supabase project URL |
| `PERMITIQ_SUPABASE_SERVICE_KEY` | Yes | Service role key (NOT anon key) |
| `PERMITIQ_SWFWMD_API_URL` | Yes | SWFWMD API endpoint |
| `PERMITIQ_LOG_LEVEL` | No | Logging level (default: INFO) |
| `PERMITIQ_DRY_RUN` | No | Dry run mode (default: false) |

### Logging

- **File**: `etl.log` (in current directory)
- **Console**: stdout
- **Format**: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- **Levels**: DEBUG, INFO, WARNING, ERROR

---

## API Constraints

### SWFWMD API Limitations

1. **Availability**
   - Only available 6 AM - 10 PM EST
   - Returns error outside these hours
   - Schedule ETL during available window

2. **Pagination**
   - Max 1,000 records per request
   - Use `resultOffset` and `resultRecordCount` parameters
   - Must loop to get all ~50,000+ records

3. **Rate Limits**
   - No documented rate limit
   - Use retry logic for robustness
   - Implemented in `_create_session()`

4. **Response Format**
   - GeoJSON-like structure
   - Fields in `features[].attributes`
   - Geometry in `features[].geometry`

### Example API Request

```bash
GET /query?where=1%3D1&outFields=*&returnGeometry=true&f=json&resultOffset=0&resultRecordCount=1000
```

**Parameters:**
- `where=1=1`: Get all records
- `outFields=*`: Return all fields
- `returnGeometry=true`: Include spatial data
- `f=json`: JSON format
- `resultOffset=0`: Starting record
- `resultRecordCount=1000`: Batch size

---

## Error Handling

### Network Errors

- Retry 3 times with exponential backoff
- Log errors and continue
- Raise exception if all retries fail

### Data Validation Errors

- Log warning for invalid timestamps
- Skip records with missing `permit_number`
- Store raw data for manual review

### Database Errors

- Transaction rollback on batch failure
- Log error details
- Re-raise exception to stop pipeline

---

## Performance

### Typical Run Times

- **Small update** (1,000 records): ~30 seconds
- **Full load** (50,000 records): ~5-10 minutes
- Depends on API response time and network speed

### Optimization Strategies

1. **Batch Processing**
   - Fetch: 1,000 records at a time
   - Load: 100 records at a time
   - Balance memory vs database connections

2. **Parallel Processing** (Future)
   - Could parallelize API fetches
   - Not implemented to avoid API overload

3. **Incremental Updates** (Future)
   - Query only records modified since last run
   - Use `last_modified_date` filter
   - Requires tracking last ETL timestamp

---

## Monitoring

### Log Files

Check `etl.log` for:
- Record counts at each stage
- Progress indicators
- Warnings and errors
- Execution time

### Success Indicators

✅ "ETL PIPELINE COMPLETED SUCCESSFULLY"
✅ Record counts match API total
✅ No errors in log
✅ Statistics calculated

### Failure Indicators

❌ "ETL PIPELINE FAILED"
❌ Network timeout errors
❌ Database connection errors
❌ API unavailable (outside 6AM-10PM EST)

---

## Automation

### GitHub Actions

**File:** `.github/workflows/daily-etl.yml`

**Trigger:**
- Schedule: Daily at 7 AM EST (12:00 UTC)
- Manual: Via GitHub Actions UI

**Steps:**
1. Checkout code
2. Set up Python 3.11
3. Install dependencies
4. Run ETL script
5. Upload logs as artifact
6. Create issue if failure

**Secrets Required:**
- `PERMITIQ_SUPABASE_URL`
- `PERMITIQ_SUPABASE_SERVICE_KEY`
- `PERMITIQ_SWFWMD_API_URL`

### Manual Execution

**Dry Run:**
```bash
PERMITIQ_DRY_RUN=true python etl/fetch_permits.py
```

**Production Run:**
```bash
python etl/fetch_permits.py
```

---

## Change Detection

### How It Works

1. **On Insert (New Permit)**
   - Create record in `erp_permit_changes`
   - `change_type = 'created'`
   - Log all fields as new values

2. **On Update (Existing Permit)**
   - Compare new data vs existing
   - Identify changed fields
   - Log old and new values
   - Create record in `erp_permit_changes`
   - `change_type = 'updated'`

3. **Tracking**
   - Each ETL run gets unique `etl_run_id` (UUID)
   - Links all changes to specific run
   - Enables auditing and rollback

### Future Enhancement: Delete Detection

- Query database for permits no longer in API
- Mark as deleted
- Log in `erp_permit_changes` with `change_type = 'deleted'`

---

## Field Mapping

### Critical Fields

These fields are essential for the application:

| Database Field | API Field (Common Variants) |
|----------------|----------------------------|
| `permit_number` | `PERMIT_NUMBER`, `PermitNumber` |
| `objectid` | `OBJECTID` |
| `applicant_name` | `APPLICANT_NAME`, `ApplicantName` |
| `issue_date` | `ISSUE_DATE`, `IssueDate` |
| `geometry.x` | Longitude |
| `geometry.y` | Latitude |

### Discovery Process

1. Run `discover_fields.py`
2. Review `api_field_discovery.json`
3. Update field mappings in `transform_permit()`
4. Test with dry run

---

## Testing

### Unit Tests (Future)

```bash
pytest etl/
```

### Manual Testing

1. **Dry Run Test**
   ```bash
   PERMITIQ_DRY_RUN=true python etl/fetch_permits.py
   ```

2. **Small Batch Test**
   Modify `fetch_all_permits()` to limit records:
   ```python
   # In fetch_permits.py
   def fetch_all_permits(self, batch_size: int = 10):  # Test with 10
   ```

3. **Field Discovery**
   ```bash
   python etl/discover_fields.py
   ```

---

## Troubleshooting

### "API Error" or Timeout

- Check if current time is 6 AM - 10 PM EST
- Verify API URL is correct
- Try in browser: `{API_URL}/query?where=1=1&f=json`

### "Missing environment variables"

- Ensure `.env` file exists
- Check all required variables are set
- No spaces around `=` in `.env`

### "Supabase connection error"

- Verify Supabase project is active
- Check URL format: `https://xxxxx.supabase.co`
- Ensure using `service_role` key, not `anon` key

### "Field not found" errors

- Run `discover_fields.py` to see actual field names
- Update field mappings in `transform_permit()`
- Check `raw_data` in database for complete API response

### Statistics not calculating

- Ensure database functions are installed
- Run migrations `002_functions.sql`
- Check Supabase logs for function errors

---

## Future Enhancements

1. **Incremental Updates**
   - Only fetch records modified since last run
   - Faster execution, less API load

2. **Parallel Processing**
   - Fetch multiple pages simultaneously
   - Requires careful rate limit handling

3. **Better Change Detection**
   - More sophisticated diff algorithm
   - Highlight significant changes vs minor updates

4. **Data Quality Checks**
   - Validate coordinates are in Florida
   - Flag suspicious data patterns
   - Alert on unexpected changes

5. **Email Notifications**
   - Summary of each ETL run
   - Alert on failures
   - Highlight hotspots detected

---

**Last Updated**: 2025-10-22
