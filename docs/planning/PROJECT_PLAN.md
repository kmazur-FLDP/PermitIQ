# PermitIQ - Project Planning Document

**Project Name:** PermitIQ  
**Type:** Internal Competitive Intelligence Platform  
**Status:** Foundation Phase  
**Start Date:** October 22, 2025  
**Developer:** Kevin Mazur

---

## Executive Summary

PermitIQ is an automated competitive intelligence platform that transforms static government permit data from the Southwest Florida Water Management District (SWFWMD) into actionable insights. The system enables proactive tracking of development activity, competitor monitoring, and market trend analysis through spatial data analysis and automated change detection.

**Key Value Propositions:**
- Automatic daily tracking of ~50,000+ environmental permits
- Hotspot detection for unusual development activity
- Competitor permit history and tracking
- Geographic clustering and spatial analysis
- Historical trend analysis and growth forecasting

---

## Project Phases

### Phase 1: Foundation & Data Discovery ✅ (Current)

**Timeline:** Week 1-2  
**Status:** In Progress

**Objectives:**
- [x] Set up database schema in Supabase
- [x] Build ETL pipeline for data collection
- [ ] Document actual API field structure
- [ ] Test spatial queries and change detection
- [ ] Initial data load and validation

**Deliverables:**
- PostgreSQL + PostGIS database schema
- Python ETL scripts with pagination handling
- GitHub Actions automation
- Field discovery documentation
- Database functions for spatial analysis

---

### Phase 2: Frontend Foundation

**Timeline:** Week 3-4  
**Status:** Not Started

**Objectives:**
- Set up React + Vite application
- Implement Supabase authentication
- Create basic map visualization with Leaflet
- Build permit search and filter UI
- Implement responsive design

**Deliverables:**
- React application structure
- User authentication flow
- Interactive map with permit markers
- Search and filter interface
- Mobile-responsive layout

---

### Phase 3: Intelligence Features

**Timeline:** Week 5-6  
**Status:** Not Started

**Objectives:**
- Implement hotspot visualization
- Build trend analysis charts
- Create competitor tracking features
- Add user bookmarking and notes
- Develop email notifications

**Deliverables:**
- Hotspot map overlay
- Recharts analytics dashboard
- Competitor monitoring interface
- User workspace for saved permits
- Automated email alerts

---

### Phase 4: Production & Polish

**Timeline:** Week 7-8  
**Status:** Not Started

**Objectives:**
- Performance optimization
- Admin panel for user management
- Comprehensive documentation
- Production deployment
- User testing and feedback

**Deliverables:**
- Optimized database queries
- Admin dashboard
- User documentation
- Production environment on Netlify
- Feedback incorporation

---

## Technical Architecture

### Tech Stack Rationale

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| **Database** | PostgreSQL + PostGIS (Supabase) | Industry standard for spatial data, managed hosting |
| **ETL** | Python | Rich ecosystem for data processing, easy API integration |
| **Automation** | GitHub Actions | Free, integrated with repo, easy scheduling |
| **Frontend** | React + Vite | Modern, performant, component-based |
| **Mapping** | Leaflet.js | Lightweight, flexible, well-documented |
| **Charts** | Recharts | React-native, declarative, good performance |
| **Auth** | Supabase Auth | Integrated with database, RLS support |
| **Hosting** | Netlify | Fast, automatic deployments, good DX |

---

## Database Design Philosophy

### Schema Principles

1. **Denormalization for Performance**
   - Store lat/lng separately despite having PostGIS geometry
   - Reason: Faster queries for non-spatial filtering

2. **Change History**
   - Every permit change logged in `erp_permit_changes`
   - Enables competitive intelligence timeline

3. **Aggregation Tables**
   - Pre-calculate daily statistics
   - Faster dashboards and trend queries

4. **Raw Data Retention**
   - Store complete API response in JSONB
   - Future-proofs against field mapping errors

### Spatial Strategy

- **Coordinate System:** WGS84 (EPSG:4326) - GPS standard
- **Geometry Type:** Point (permits are location-based)
- **Index:** GIST for efficient spatial queries
- **Functions:** PostGIS for distance, clustering, containment

---

## API Strategy

### SWFWMD API Analysis

**Strengths:**
- Comprehensive permit data (~50,000 records)
- GeoJSON format with coordinates
- Well-structured attributes

**Challenges:**
- Limited availability (6 AM - 10 PM EST)
- Pagination required (1,000 record limit)
- Field name inconsistencies
- No change tracking endpoint

**Our Solutions:**
- Schedule ETL during available hours (7 AM EST)
- Implement pagination loop
- Field discovery tool for documentation
- Build our own change detection

---

## Hotspot Detection Algorithm

### Scoring Methodology (0-10 scale)

#### Volume Surge (0-4 points)
Measures current activity vs recent average.

- **4 pts:** ≥200% vs 30-day average
- **3 pts:** ≥100% vs 30-day average
- **2 pts:** ≥50% vs 30-day average
- **1 pt:** ≥25% vs 30-day average

#### Sustained Growth (0-3 points)
Measures longer-term trends.

- **3 pts:** ≥100% vs 90-day average
- **2 pts:** ≥50% vs 90-day average
- **1 pt:** ≥25% vs 90-day average

#### Absolute Volume (0-3 points)
Recognizes high-volume areas regardless of trends.

- **3 pts:** ≥50 new permits
- **2 pts:** ≥25 new permits
- **1 pt:** ≥10 new permits

### Hotspot Threshold

- **Score ≥ 5.0:** Flagged as hotspot
- **Visualized:** Heat map overlay on map
- **Alerted:** Optional email notifications

### Geographic Clustering

Use DBSCAN algorithm via PostGIS:
- Radius: 1 mile (1,609 meters)
- Min points: 5 permits
- Detects dense permit clusters

---

## Data Governance

### Privacy & Security

- **No PII Collection:** Only public permit data
- **RLS Enabled:** Users see only their own bookmarks
- **Service Key Isolation:** Backend/automation only
- **Secret Management:** Environment variables, never in git

### Data Retention

- **Permits:** Indefinite (historical value)
- **Change History:** 2 years (automated cleanup)
- **Statistics:** Indefinite (small footprint)
- **Logs:** 30 days (GitHub Actions artifacts)

### Data Quality

- **Source of Truth:** SWFWMD API (government)
- **Validation:** Spatial bounds check (Florida only)
- **Deduplication:** Unique constraint on `permit_number`
- **Audit Trail:** Change history with ETL run ID

---

## User Workflows

### Admin Workflow

1. **System Monitoring**
   - Review GitHub Actions workflow status
   - Check ETL logs for errors
   - Monitor hotspot alerts

2. **User Management**
   - Create user accounts
   - Assign roles (admin/user)
   - Review activity logs

3. **Data Quality**
   - Investigate anomalies
   - Update field mappings if API changes
   - Refresh statistics if needed

### End User Workflow

1. **Discovery**
   - View map of recent permits
   - Filter by county, date, applicant
   - Search for specific companies

2. **Analysis**
   - Identify hotspots
   - Review trend charts
   - Compare historical activity

3. **Tracking**
   - Bookmark competitor permits
   - Add notes and tags
   - Receive email alerts

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| API availability changes | High | Cache data, monitor uptime, contact SWFWMD |
| API field structure changes | Medium | Field discovery tool, raw data retention |
| Supabase outage | High | Choose Supabase (high uptime SLA) |
| GitHub Actions limits | Low | Well within free tier limits |
| Large dataset performance | Medium | Indexes, aggregation tables, pagination |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data becomes paywalled | High | Existing data remains valuable |
| Competitor builds similar tool | Low | Internal use only, not public |
| Low user adoption | Low | Start with admin only, prove value |

---

## Success Metrics

### Phase 1 (Foundation)

- [x] Database schema deployed
- [x] ETL pipeline functional
- [ ] Initial data load complete (50,000+ records)
- [ ] Change detection validated
- [ ] Statistics calculating correctly

### Phase 2 (Frontend)

- [ ] User authentication working
- [ ] Map displays all permits
- [ ] Search returns accurate results
- [ ] Mobile responsive

### Phase 3 (Intelligence)

- [ ] Hotspots detected and visualized
- [ ] Trends displayed in charts
- [ ] Bookmarks functional
- [ ] Email alerts working

### Phase 4 (Production)

- [ ] Page load < 2 seconds
- [ ] 99%+ ETL success rate
- [ ] Zero security vulnerabilities
- [ ] Positive user feedback

---

## Future Enhancements (Post-MVP)

### Advanced Features

1. **Predictive Analytics**
   - Machine learning for growth forecasting
   - Anomaly detection beyond simple thresholds
   - Seasonal trend analysis

2. **Enhanced Mapping**
   - Property boundary overlays
   - Multi-county comparisons
   - Time-lapse animations

3. **Reporting**
   - PDF export of analysis
   - Automated weekly summaries
   - Custom report builder

4. **Integrations**
   - Property data APIs
   - GIS data sources
   - CRM integration

### Scalability

1. **Multi-District**
   - Expand to other Florida water districts
   - Unified dashboard across regions

2. **Additional Permit Types**
   - Building permits
   - Environmental permits (DEP)
   - Mining permits

3. **API Development**
   - Public API for internal tools
   - Webhook notifications
   - Data export endpoints

---

## Portfolio Positioning

### Demonstration Points

**Full-Stack Capability:**
- Backend: Database design, ETL pipelines, API integration
- Frontend: React, spatial visualization, responsive design
- DevOps: GitHub Actions, environment management, deployment

**Data Engineering:**
- Spatial data processing (PostGIS)
- Change detection algorithms
- Automated data pipelines

**Production-Grade Practices:**
- Type hints and documentation
- Error handling and logging
- Secret management
- Automated testing (future)

**Domain Expertise:**
- Environmental regulation understanding
- Competitive intelligence methodologies
- Real estate/development sector knowledge

---

## Development Guidelines

### Code Standards

**Python:**
- Type hints on all functions
- Docstrings in Google style
- Black formatting (line length 100)
- pylint compliance

**SQL:**
- snake_case naming
- Comments on complex queries
- Index all foreign keys
- EXPLAIN ANALYZE for optimization

**JavaScript/React:**
- Functional components
- ESLint compliance
- PropTypes or TypeScript
- Component documentation

**Git:**
- Descriptive commit messages
- Feature branches for major work
- Never commit secrets
- PR reviews for production

---

## Timeline & Milestones

### Week 1-2: Foundation ✅
- Database schema
- ETL pipeline
- GitHub Actions
- Documentation

### Week 3-4: Frontend
- React setup
- Authentication
- Map visualization
- Search interface

### Week 5-6: Intelligence
- Hotspot detection
- Trend charts
- Bookmarking
- Notifications

### Week 7-8: Production
- Performance tuning
- Admin panel
- Testing
- Deployment

### Target Launch
**End of Week 8** - Internal beta release

---

## Next Steps (Phase 1)

### Immediate Actions

1. **Run Field Discovery**
   ```bash
   python etl/discover_fields.py
   ```

2. **Review Field Mappings**
   - Check `api_field_discovery.json`
   - Update `transform_permit()` if needed

3. **Initial Data Load**
   ```bash
   # Test with dry run first
   PERMITIQ_DRY_RUN=true python etl/fetch_permits.py
   
   # Then production load
   python etl/fetch_permits.py
   ```

4. **Verify Data**
   - Check record counts in Supabase
   - Test spatial queries
   - Validate statistics

5. **Set Up GitHub Secrets**
   - Add Supabase credentials
   - Test GitHub Actions workflow

---

## Resources & References

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [PostGIS Manual](https://postgis.net/docs/)
- [Leaflet.js Guide](https://leafletjs.com/)
- [SWFWMD ERP Viewer](https://www.swfwmd.state.fl.us/permits/erpviewer)

### Tools
- Supabase Dashboard: Project management
- GitHub Actions: Workflow monitoring
- Postman: API testing

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Next Review:** End of Phase 1
