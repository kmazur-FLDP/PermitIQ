# Quick Start Guide

Get PermitIQ running in 15 minutes.

## 1. Create Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `permitiq`, choose region, create
3. Wait for project to provision
4. Go to **SQL Editor** → New query → Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

## 2. Run Database Migrations (2 min)

Copy and paste these files into Supabase SQL Editor and run in order:

1. `database/migrations/001_initial_schema.sql`
2. `database/migrations/002_functions.sql`

## 3. Get API Keys (1 min)

In Supabase: **Settings** → **API**

Copy:
- Project URL
- `service_role` key (NOT anon key)

## 4. Set Up Locally (5 min)

```bash
# Install Python dependencies
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials
```

## 5. Test the Pipeline (2 min)

```bash
# Dry run to test (no database writes)
PERMITIQ_DRY_RUN=true python etl/fetch_permits.py

# If successful, run for real
python etl/fetch_permits.py
```

## 6. Verify Data

In Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM erp_permits;
```

Should see ~50,000+ records.

---

## Next Steps

1. Set up GitHub Actions (see `docs/SETUP.md`)
2. Explore the data in Supabase
3. Start building the frontend (Phase 2)

---

**Need help?** Check `docs/SETUP.md` for detailed instructions.
