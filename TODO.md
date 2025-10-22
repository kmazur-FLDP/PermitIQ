# PermitIQ - To-Do List

## Phase 1: Foundation & Data Discovery

### Database Setup
- [x] Design database schema
- [x] Create PostgreSQL + PostGIS tables
- [x] Implement Row Level Security (RLS)
- [x] Create spatial analysis functions
- [x] Create change detection functions
- [x] Create statistics & hotspot functions

### ETL Pipeline
- [x] Build SWFWMD API client with pagination
- [x] Implement data transformation logic
- [x] Add retry logic and error handling
- [x] Create upsert functionality
- [x] Add logging and monitoring
- [x] Build field discovery utility
- [ ] Run field discovery and document actual API structure
- [ ] Update field mappings based on discovery
- [ ] Test ETL pipeline with dry run
- [ ] Execute initial data load
- [ ] Validate data in Supabase

### Automation
- [x] Create GitHub Actions workflow
- [x] Configure daily schedule (7 AM EST)
- [ ] Add GitHub secrets
- [ ] Test automated workflow
- [ ] Set up failure notifications

### Documentation
- [x] Write comprehensive README
- [x] Create setup guide
- [x] Document database schema
- [x] Document ETL pipeline
- [x] Create project planning doc
- [x] Write quickstart guide

---

## Phase 2: Frontend Foundation

### Project Setup
- [ ] Initialize React + Vite project
- [ ] Set up project structure
- [ ] Install dependencies (Leaflet, Recharts, etc.)
- [ ] Configure build and deploy

### Authentication
- [ ] Set up Supabase Auth integration
- [ ] Create login/signup pages
- [ ] Implement protected routes
- [ ] Add user profile management
- [ ] Handle session management

### Map Visualization
- [ ] Integrate Leaflet.js
- [ ] Display permit markers on map
- [ ] Implement marker clustering
- [ ] Add county boundaries overlay
- [ ] Create popup with permit details
- [ ] Add map controls (zoom, search, filters)

### Search & Filter
- [ ] Build search interface
- [ ] Implement applicant/company search
- [ ] Add date range filter
- [ ] Add county filter
- [ ] Add permit status filter
- [ ] Display search results list

### Responsive Design
- [ ] Create mobile-friendly layout
- [ ] Test on various devices
- [ ] Optimize performance

---

## Phase 3: Intelligence Features

### Hotspot Detection
- [ ] Visualize hotspots on map (heat overlay)
- [ ] Create hotspot list view
- [ ] Add hotspot details panel
- [ ] Implement hotspot scoring display
- [ ] Add hotspot filtering

### Trend Analysis
- [ ] Build analytics dashboard
- [ ] Create permit volume chart (Recharts)
- [ ] Create county comparison chart
- [ ] Add time series analysis
- [ ] Display growth metrics

### Competitor Tracking
- [ ] Create bookmarks feature
- [ ] Build user workspace
- [ ] Implement notes and tags
- [ ] Add competitor permit timeline
- [ ] Create competitor comparison view

### Notifications
- [ ] Design email notification system
- [ ] Implement hotspot alerts
- [ ] Add bookmark change notifications
- [ ] Create notification preferences UI
- [ ] Test email delivery

---

## Phase 4: Production & Polish

### Performance
- [ ] Optimize database queries
- [ ] Add indexes where needed
- [ ] Implement lazy loading
- [ ] Optimize map rendering
- [ ] Measure and improve page load times

### Admin Panel
- [ ] Create admin dashboard
- [ ] Build user management interface
- [ ] Add ETL run history view
- [ ] Implement data quality monitoring
- [ ] Add system health checks

### Testing
- [ ] Write unit tests for ETL
- [ ] Write integration tests
- [ ] Test user workflows
- [ ] Cross-browser testing
- [ ] Load testing

### Documentation
- [ ] Create user guide
- [ ] Document API endpoints
- [ ] Write admin documentation
- [ ] Create troubleshooting guide

### Deployment
- [ ] Deploy frontend to Netlify
- [ ] Configure custom domain
- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables
- [ ] Test production deployment

### User Feedback
- [ ] Conduct user testing
- [ ] Gather feedback
- [ ] Prioritize improvements
- [ ] Implement critical fixes

---

## Backlog (Future Enhancements)

### Advanced Features
- [ ] Machine learning for predictive analytics
- [ ] Time-lapse map animations
- [ ] PDF report generation
- [ ] Advanced clustering algorithms
- [ ] Custom alert rules

### Integrations
- [ ] Property data API integration
- [ ] Additional GIS data sources
- [ ] CRM integration
- [ ] Webhook system

### Scalability
- [ ] Expand to other Florida districts
- [ ] Add building permit data
- [ ] Multi-region support
- [ ] Public API development

---

## Current Priority

**Focus:** Complete Phase 1 - Foundation & Data Discovery

**Next 3 Tasks:**
1. Run `python etl/discover_fields.py` to document API structure
2. Update field mappings in `fetch_permits.py` based on discovery
3. Execute initial data load: `python etl/fetch_permits.py`

---

**Last Updated:** October 22, 2025
