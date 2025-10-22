# PermitIQ - Project Summary

**Status:** Foundation Phase Complete ✅  
**Date:** October 22, 2025  
**Next Steps:** Run field discovery → Initial data load → Start frontend

---

## What's Been Built

### 🗄️ Database Architecture
- **5 core tables** with PostGIS spatial support
- **11 helper functions** for spatial analysis and statistics
- **Row-level security** for user data protection
- **Change tracking** for competitive intelligence
- **Hotspot detection** algorithm implementation

### 🔄 ETL Pipeline
- **SWFWMD API client** with pagination (handles 50,000+ records)
- **Retry logic** for transient failures
- **Change detection** to log what changed between runs
- **Dry run mode** for safe testing
- **Field discovery utility** to document API structure

### 🤖 Automation
- **GitHub Actions workflow** for daily execution at 7 AM EST
- **Manual trigger** option with dry run toggle
- **Artifact upload** for logs
- **Automatic issue creation** on failure

### 📚 Documentation
- **README.md** - Project overview and features
- **QUICKSTART.md** - 15-minute setup guide
- **docs/SETUP.md** - Comprehensive setup instructions
- **docs/DATABASE.md** - Database schema documentation
- **docs/ETL.md** - ETL pipeline documentation
- **docs/planning/PROJECT_PLAN.md** - Full project plan
- **TODO.md** - Task tracking across all phases

### 🛠️ Developer Tools
- **dev.py** - Helper script for common tasks
- **.env.example** - Environment template
- **.gitignore** - Comprehensive ignore rules
- **requirements.txt** - Python dependencies

---

## File Structure

```
PermitIQ/
├── .github/
│   └── workflows/
│       └── daily-etl.yml          # GitHub Actions automation
├── database/
│   └── migrations/
│       ├── 001_initial_schema.sql # Core schema + tables
│       └── 002_functions.sql      # Spatial & stats functions
├── docs/
│   ├── planning/
│   │   └── PROJECT_PLAN.md        # Comprehensive project plan
│   ├── DATABASE.md                # Schema documentation
│   ├── ETL.md                     # Pipeline documentation
│   └── SETUP.md                   # Detailed setup guide
├── etl/
│   ├── fetch_permits.py          # Main ETL pipeline
│   └── discover_fields.py        # API discovery utility
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── dev.py                         # Development helper script
├── QUICKSTART.md                  # Fast setup guide
├── README.md                      # Project overview
├── requirements.txt               # Python dependencies
└── TODO.md                        # Task tracking
```

---

## Quick Commands

```bash
# Development helper commands
python dev.py discover     # Discover API field structure
python dev.py test         # Test ETL with dry run
python dev.py load         # Load data into database
python dev.py count        # Count database records
python dev.py recent       # Show recent permits
python dev.py stats        # Recalculate statistics

# Direct commands
python etl/discover_fields.py              # Field discovery
PERMITIQ_DRY_RUN=true python etl/fetch_permits.py  # Dry run test
python etl/fetch_permits.py                # Production load
```

---

## Next 3 Steps

### 1. Run Field Discovery
```bash
python dev.py discover
```
Review `docs/planning/api_field_discovery.json` to see actual API field names.

### 2. Update Field Mappings (if needed)
Based on discovery results, update the `transform_permit()` method in `etl/fetch_permits.py`.

### 3. Initial Data Load
```bash
# Test first
python dev.py test

# Then load
python dev.py load
```

---

## Key Environment Variables

Create `.env` file from `.env.example`:

```bash
PERMITIQ_SUPABASE_URL=https://xxxxx.supabase.co
PERMITIQ_SUPABASE_SERVICE_KEY=your-service-role-key
PERMITIQ_SWFWMD_API_URL=https://www25.swfwmd.state.fl.us/arcgis10/rest/services/Permits/ErpViewerERPs/MapServer/0
```

---

## Database Schema Highlights

### Core Tables
1. **erp_permits** - 50,000+ permit records with PostGIS geometry
2. **erp_permit_changes** - Change history for intelligence
3. **erp_statistics** - Daily aggregated metrics
4. **user_profiles** - User accounts (admin/user roles)
5. **user_bookmarks** - Saved permits with notes

### Key Functions
- `find_permits_near_point()` - Spatial radius search
- `detect_permit_clusters()` - DBSCAN clustering
- `calculate_daily_statistics()` - Metric aggregation
- `calculate_hotspot_scores()` - 0-10 scoring algorithm

---

## Hotspot Algorithm

**Score Range:** 0-10

**Components:**
- **Volume Surge (0-4 pts):** Current vs 30-day average
- **Sustained Growth (0-3 pts):** Current vs 90-day average
- **Absolute Volume (0-3 pts):** Raw permit count

**Threshold:** Score ≥ 5.0 = Hotspot

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Database | PostgreSQL + PostGIS | Spatial data storage |
| Hosting | Supabase | Managed database + API |
| ETL | Python 3.11+ | Data pipeline |
| Automation | GitHub Actions | Daily scheduled runs |
| Frontend | React + Vite | UI (Phase 2) |
| Mapping | Leaflet.js | Map visualization (Phase 2) |
| Charts | Recharts | Analytics (Phase 3) |

---

## Security Considerations

✅ **Environment variables** for all secrets  
✅ **Row-level security** on user tables  
✅ **Service role key** isolated to backend  
✅ **.gitignore** prevents secret commits  
✅ **GitHub Secrets** for automation  

---

## API Constraints to Remember

- ⏰ **Available:** 6 AM - 10 PM EST only
- 📊 **Max Records:** 1,000 per request (pagination required)
- 🗺️ **Coverage:** 16 counties, ~50,000+ permits
- 🔄 **Updates:** Unknown frequency (daily assumed)

---

## GitHub Actions Setup

### Required Secrets

Add in **Settings → Secrets → Actions**:
- `PERMITIQ_SUPABASE_URL`
- `PERMITIQ_SUPABASE_SERVICE_KEY`
- `PERMITIQ_SWFWMD_API_URL`

### Schedule
Daily at 7 AM EST (12:00 UTC)

---

## Monitoring

### Success Indicators
✅ GitHub Actions workflow status = green  
✅ `etl.log` contains "COMPLETED SUCCESSFULLY"  
✅ Record count in database matches API  
✅ Statistics table updating daily  

### Failure Indicators
❌ Workflow fails (creates GitHub issue)  
❌ Errors in `etl.log`  
❌ Record count stops increasing  
❌ API unavailable errors  

---

## What's Next (Phase 2)

### Frontend Foundation
- React + Vite setup
- Supabase Auth integration
- Leaflet map with permit markers
- Search and filter interface
- Responsive design

**Timeline:** Weeks 3-4

---

## Portfolio Highlights

**This project demonstrates:**

✨ **Full-stack capability** - Database → ETL → API → Frontend  
✨ **Spatial data engineering** - PostGIS, geographic analysis  
✨ **Production architecture** - Automation, monitoring, security  
✨ **Clean code practices** - Type hints, docs, standards  
✨ **Real business value** - Competitive intelligence system  

---

## Resources

- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Actions:** `.github/workflows/daily-etl.yml`
- **SWFWMD ERP Viewer:** https://www.swfwmd.state.fl.us/permits/erpviewer
- **API Endpoint:** Check `.env` file

---

## Support & Troubleshooting

**Common Issues:**
1. API unavailable → Check time (must be 6AM-10PM EST)
2. Field mapping errors → Run `dev.py discover`
3. Connection errors → Verify `.env` credentials
4. Import errors → Ensure dependencies installed (`pip install -r requirements.txt`)

**Full troubleshooting guide:** `docs/SETUP.md` or `docs/ETL.md`

---

## Companion Project

**SiteIQ** - Uses same "IQ" branding for consistency

---

**Built with care for competitive intelligence** 🎯

**Status:** Ready for field discovery and initial data load! 🚀
