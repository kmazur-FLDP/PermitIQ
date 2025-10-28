# PermitIQ

**Internal Competitive Intelligence Platform for Environmental Resource Permits**

PermitIQ is a web-based intelligence platform that automatically tracks and analyzes Environmental Resource Permits (ERPs) from the Southwest Florida Water Management District (SWFWMD). The system transforms static government permit data into actionable competitive insights through automated data collection, spatial analysis, and trend detection.

---

## 🎯 Purpose

- **Primary Use**: Competitive intelligence and market analysis
- **Data Source**: SWFWMD Environmental Resource Permits (~50,000+ permits)
- **Coverage**: 16 counties in Southwest Florida
- **Target Users**: Internal team (admin + user roles)

---

## 🏗️ Architecture

### Technical Stack

- **Backend**: PostgreSQL + PostGIS (Supabase)
- **ETL**: Python with GitHub Actions automation (daily at 7 AM EST)
- **Frontend**: React + Vite (to be developed)
- **Mapping**: Leaflet.js with clustering
- **Analytics**: Recharts
- **Auth**: Supabase Auth (two-tier: admin/user)
- **Hosting**: Netlify (frontend), Supabase (database + API)

### Data Pipeline

```
SWFWMD ArcGIS API → Python ETL → PostgreSQL/PostGIS → Supabase API → React Frontend
       ↓                ↓              ↓
   6AM-10PM EST    Daily 7AM      Change Detection
   Max 1000/req    Automated       Hotspot Scoring
```

---

## 📊 Core Features

1. **Automated ETL Pipeline**
   - Daily data sync from SWFWMD API
   - Change detection and history tracking
   - Handles API pagination (1,000 record limit)

2. **Spatial Analysis**
   - PostGIS for geographic queries
   - Hotspot detection algorithm
   - 1-mile radius clustering

3. **Competitive Intelligence**
   - Track competitors' permit activity
   - Trend analysis and historical comparisons
   - Bookmarking and notes

4. **Hotspot Detection**
   - Volume surge: >2x historical average
   - Sustained growth: 3+ months above average
   - Geographic clustering
   - 0-10 scoring system

---

## 🗄️ Database Schema

### Core Tables

- **`erp_permits`**: Main permit data with PostGIS geometry
- **`erp_permit_changes`**: Change history for intelligence tracking
- **`erp_statistics`**: Daily aggregated metrics
- **`user_profiles`**: User accounts (linked to Supabase auth)
- **`user_bookmarks`**: Saved permits per user

### Key Functions

- `find_permits_near_point(lng, lat, radius)` - Spatial proximity search
- `detect_permit_clusters()` - Geographic clustering analysis
- `calculate_daily_statistics()` - Daily metrics aggregation
- `calculate_hotspot_scores()` - Hotspot scoring algorithm

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Supabase account
- Access to SWFWMD API (available 6 AM - 10 PM EST)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PermitIQ
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run migrations in order:
     ```bash
     # In Supabase SQL Editor:
     # 1. database/migrations/001_initial_schema.sql
     # 2. database/migrations/002_functions.sql
     ```

5. **Discover API fields** (first-time setup)
   ```bash
   python etl/discover_fields.py
   ```
   This creates `docs/planning/api_field_discovery.json` with actual API field names.

6. **Run ETL pipeline**
   ```bash
   python etl/fetch_permits.py
   ```

### Environment Variables

Create a `.env` file with:

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

**⚠️ NEVER commit the `.env` file to git!**

---

## 📁 Project Structure

```
PermitIQ/
├── .github/
│   └── workflows/
│       └── daily-etl.yml          # GitHub Actions automation
├── database/
│   └── migrations/
│       ├── 001_initial_schema.sql # Database schema
│       └── 002_functions.sql      # Helper functions
├── docs/
│   └── planning/                  # Planning documents
├── etl/
│   ├── fetch_permits.py          # Main ETL pipeline
│   └── discover_fields.py        # API field discovery tool
├── frontend/                      # React app (to be created)
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

---

## 🤖 Automated ETL

The ETL pipeline runs automatically via GitHub Actions:

- **Schedule**: Daily at 7 AM EST
- **Trigger**: `.github/workflows/daily-etl.yml`
- **Manual Run**: Via GitHub Actions UI

### GitHub Secrets Required

Add these secrets to your GitHub repository:

- `PERMITIQ_SUPABASE_URL`
- `PERMITIQ_SUPABASE_SERVICE_KEY`
- `PERMITIQ_SWFWMD_API_URL`

---

## 🔧 Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black etl/
```

### Manual ETL Run (Dry Run)

```bash
PERMITIQ_DRY_RUN=true python etl/fetch_permits.py
```

---

## 📈 Hotspot Algorithm

The hotspot detection algorithm scores locations (0-10) based on:

| Factor | Weight | Criteria |
|--------|--------|----------|
| Volume surge | 0-4 pts | Current activity vs 30-day average |
| Sustained growth | 0-3 pts | Activity vs 90-day average |
| Absolute volume | 0-3 pts | Number of new permits |

**Hotspot Threshold**: Score ≥ 5.0

---

## 🔐 Security

- Row-level security (RLS) on user data
- Service role key only in backend/automation
- No secrets in git repository
- User authentication via Supabase Auth

---

## 📝 Data Source Notes

### SWFWMD API Constraints

- **Availability**: 6 AM - 10 PM EST only
- **Pagination**: Maximum 1,000 records per request
- **Coverage**: 16 counties in Southwest Florida
- **Update Frequency**: Daily (exact timing unknown)

### Field Mapping

Run `discover_fields.py` to document actual API field names, as they may differ from documentation. Results saved to `docs/planning/api_field_discovery.json`.

---

## 🎨 Portfolio Considerations

This project demonstrates:

- ✅ Full-stack spatial data engineering
- ✅ Automated ETL pipelines with change detection
- ✅ Real-time intelligence systems
- ✅ Production-grade architecture
- ✅ Clean code with type hints and documentation
- ✅ Proper secret management

---

## 🚧 Roadmap

### Phase 1: Foundation (Current)
- [x] Database schema design
- [x] ETL pipeline implementation
- [x] GitHub Actions automation
- [ ] Field discovery and mapping
- [ ] Initial data load

### Phase 2: Frontend Development
- [ ] React application setup
- [ ] Leaflet.js map integration
- [ ] Search and filter UI
- [ ] User authentication

### Phase 3: Intelligence Features
- [ ] Hotspot visualization
- [ ] Trend analysis charts
- [ ] Competitor tracking
- [ ] Email notifications

### Phase 4: Production
- [ ] Performance optimization
- [ ] User documentation
- [ ] Admin panel
- [ ] Production deployment

---

## 🤝 Contributing

This is an internal project. For questions or suggestions, contact the development team.

---

## 📄 License

Internal use only - Not for public distribution

---

## 🔗 Related Projects

**SiteIQ** - Companion tool using the "IQ" branding for consistency

---

**Built with ❤️ for competitive intelligence**
