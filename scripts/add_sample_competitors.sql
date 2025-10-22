-- PermitIQ - Add Sample Competitors to Watchlist
-- Run this in Supabase SQL Editor to populate competitor watchlist

-- Add D.R. Horton
INSERT INTO competitor_watchlist (
    company_name,
    company_aliases,
    competitor_type,
    priority_level,
    alert_enabled,
    added_by
) VALUES (
    'D.R. Horton',
    ARRAY['DR Horton', 'D R Horton', 'Horton Homes', 'D.R. Horton Inc'],
    'direct',
    'high',
    true,
    'admin'
)
ON CONFLICT (company_name) DO UPDATE SET
    company_aliases = EXCLUDED.company_aliases,
    updated_at = NOW()
RETURNING id, company_name;

-- Add Lennar Homes
INSERT INTO competitor_watchlist (
    company_name,
    company_aliases,
    competitor_type,
    priority_level,
    alert_enabled,
    added_by
) VALUES (
    'Lennar Homes',
    ARRAY['Lennar', 'Lennar Corporation', 'Lennar Corp', 'Lennar, LLC'],
    'direct',
    'high',
    true,
    'admin'
)
ON CONFLICT (company_name) DO UPDATE SET
    company_aliases = EXCLUDED.company_aliases,
    updated_at = NOW()
RETURNING id, company_name;

-- Add Pulte Group
INSERT INTO competitor_watchlist (
    company_name,
    company_aliases,
    competitor_type,
    priority_level,
    alert_enabled,
    added_by
) VALUES (
    'Pulte Group',
    ARRAY['Pulte Homes', 'Pulte', 'Centex Homes', 'Centex'],
    'direct',
    'medium',
    true,
    'admin'
)
ON CONFLICT (company_name) DO UPDATE SET
    company_aliases = EXCLUDED.company_aliases,
    updated_at = NOW()
RETURNING id, company_name;

-- Now match permits for all competitors
SELECT 
    c.id,
    c.company_name,
    match_competitor_permits(c.id) as matches_found
FROM competitor_watchlist c
ORDER BY c.company_name;

-- View results
SELECT 
    c.company_name,
    c.competitor_type,
    c.priority_level,
    c.total_permits,
    c.last_permit_date,
    c.alert_enabled
FROM competitor_watchlist c
ORDER BY c.total_permits DESC;

-- Show sample matches
SELECT 
    c.company_name,
    p.permit_number,
    p.project_name,
    p.applicant_name,
    m.match_method,
    m.match_confidence
FROM competitor_permit_matches m
JOIN competitor_watchlist c ON c.id = m.competitor_id
JOIN erp_permits p ON p.id = m.permit_id
ORDER BY c.company_name, m.match_confidence DESC
LIMIT 20;
