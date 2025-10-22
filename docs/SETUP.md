# PermitIQ - Setup Guide

This guide walks you through setting up PermitIQ from scratch.

---

## Prerequisites

- **Python 3.11+** installed
- **Supabase account** (free tier works)
- **Git** installed
- **GitHub account** (for automated ETL)

---

## Step 1: Supabase Project Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name: `permitiq`
4. Set a strong database password (save this!)
5. Choose region closest to you
6. Click "Create new project"

### 1.2 Enable PostGIS

1. Go to **SQL Editor** in Supabase
2. Click "New query"
3. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

### 1.3 Run Database Migrations

In the SQL Editor, run the migration files in order:

1. Copy contents of `database/migrations/001_initial_schema.sql`
2. Paste and run in SQL Editor
3. Verify no errors
4. Copy contents of `database/migrations/002_functions.sql`
5. Paste and run in SQL Editor
6. Verify no errors

### 1.4 Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `service_role` key (NOT the anon key)

---

## Step 2: Local Environment Setup

### 2.1 Clone Repository

```bash
cd ~/Documents/Kevin\ Work/PermitIQ
```

### 2.2 Create Python Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# On Windows: venv\Scripts\activate
```

### 2.3 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.4 Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Supabase Configuration
PERMITIQ_SUPABASE_URL=https://your-project.supabase.co
PERMITIQ_SUPABASE_SERVICE_KEY=your-service-role-key-here

# SWFWMD API Configuration
PERMITIQ_SWFWMD_API_URL=https://www25.swfwmd.state.fl.us/arcgis10/rest/services/Permits/ErpViewerERPs/MapServer/0

# Optional Settings
PERMITIQ_LOG_LEVEL=INFO
PERMITIQ_DRY_RUN=false
```

---

## Step 3: Discover API Fields

The SWFWMD API field names may not match documentation. Run the discovery script:

```bash
python etl/discover_fields.py
```

This creates `docs/planning/api_field_discovery.json` with actual field names.

**Review the output** and update `fetch_permits.py` field mappings if needed.

---

## Step 4: Initial Data Load

### 4.1 Test with Dry Run

```bash
PERMITIQ_DRY_RUN=true python etl/fetch_permits.py
```

This will:
- Fetch data from SWFWMD API
- Transform data
- Show what would be loaded
- **NOT write to database**

### 4.2 Run Full ETL

If dry run looks good:

```bash
python etl/fetch_permits.py
```

This will:
- Fetch all permits (~50,000+ records)
- Load into Supabase
- Calculate statistics
- Take ~5-10 minutes

### 4.3 Verify Data

In Supabase SQL Editor:

```sql
-- Check record count
SELECT COUNT(*) FROM erp_permits;

-- Check recent permits
SELECT permit_number, applicant_name, county, issue_date
FROM erp_permits
ORDER BY issue_date DESC
LIMIT 10;

-- Check statistics
SELECT * FROM erp_statistics
ORDER BY stat_date DESC
LIMIT 10;
```

---

## Step 5: GitHub Actions Automation

### 5.1 Push to GitHub

```bash
git add .
git commit -m "Initial PermitIQ setup"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 5.2 Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret"
4. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `PERMITIQ_SUPABASE_URL` | Your Supabase project URL |
| `PERMITIQ_SUPABASE_SERVICE_KEY` | Your Supabase service_role key |
| `PERMITIQ_SWFWMD_API_URL` | SWFWMD API endpoint |

### 5.3 Test Automated Run

1. Go to **Actions** tab in GitHub
2. Click "PermitIQ Daily ETL"
3. Click "Run workflow"
4. Select "true" for dry run (first test)
5. Click "Run workflow"
6. Monitor the execution

---

## Step 6: Verify Automation

### 6.1 Check Workflow Status

- Workflow should complete successfully
- Check logs for any errors
- Verify data was loaded (if not dry run)

### 6.2 Schedule

The workflow is configured to run daily at 7 AM EST automatically.

---

## Troubleshooting

### Python Dependencies Not Installing

```bash
# Upgrade pip first
pip install --upgrade pip

# Try installing one by one
pip install requests
pip install python-dotenv
pip install supabase
```

### Supabase Connection Error

- Verify `PERMITIQ_SUPABASE_URL` is correct (include `https://`)
- Verify you're using `service_role` key, not `anon` key
- Check Supabase project is active

### SWFWMD API Not Responding

- API only available **6 AM - 10 PM EST**
- Check if you're in the available time window
- Try accessing the API URL in a browser

### PostGIS Functions Not Found

- Ensure PostGIS extension is enabled:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```
- Re-run migration files

### Field Mapping Errors

- Run `discover_fields.py` to see actual field names
- Update field mappings in `fetch_permits.py` transform_permit() method
- Field names in API response may differ from documentation

---

## Next Steps

1. **Test the ETL pipeline** with a dry run
2. **Run initial data load** to populate database
3. **Verify data quality** in Supabase
4. **Set up GitHub Actions** for automation
5. **Start frontend development** (Phase 2)

---

## Maintenance

### Daily Checks

- Monitor GitHub Actions workflow runs
- Check `etl.log` for errors
- Verify statistics are updating

### Weekly Tasks

- Review hotspot scores
- Check for data quality issues
- Monitor API field changes

### Monthly Tasks

- Review change detection logs
- Analyze trends
- Clean up old logs

---

## Support

For issues or questions, check:

1. `etl.log` file for detailed error messages
2. GitHub Actions workflow logs
3. Supabase logs in dashboard

---

**Good luck! 🚀**
