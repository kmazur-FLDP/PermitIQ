-- PermitIQ Database Schema - Migration 006
-- Add alert notifications system
-- Version: 1.0.0
-- Created: 2025-10-22

-- ============================================================================
-- TABLE: alert_notifications
-- Purpose: Track alerts generated for competitor activity and permit changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_notifications (
    id BIGSERIAL PRIMARY KEY,
    
    -- Alert classification
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'new_competitor_permit',
        'competitor_near_location',
        'permit_revision',
        'permit_expiring',
        'hotspot_detected',
        'custom'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
    
    -- Related entities
    competitor_id BIGINT REFERENCES competitor_watchlist(id) ON DELETE SET NULL,
    permit_id BIGINT REFERENCES erp_permits(id) ON DELETE SET NULL,
    
    -- Alert content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB, -- Additional structured data
    
    -- Delivery status
    status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'acknowledged')) DEFAULT 'pending',
    delivery_method TEXT[], -- ['email', 'slack', 'webhook', 'dashboard']
    
    -- Email delivery
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_recipients TEXT[],
    email_error TEXT,
    
    -- Webhook delivery
    webhook_sent BOOLEAN DEFAULT false,
    webhook_sent_at TIMESTAMP WITH TIME ZONE,
    webhook_url TEXT,
    webhook_response_code INTEGER,
    webhook_error TEXT,
    
    -- User interaction
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-archive old alerts
    
    -- Deduplication
    dedup_key TEXT UNIQUE -- Prevent duplicate alerts
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alert_notifications_type ON alert_notifications(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_severity ON alert_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_competitor_id ON alert_notifications(competitor_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_permit_id ON alert_notifications(permit_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at ON alert_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_acknowledged ON alert_notifications(acknowledged) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_alert_notifications_pending ON alert_notifications(status) WHERE status = 'pending';

-- Add comments
COMMENT ON TABLE alert_notifications IS 'Alert notifications for competitor activity and permit changes';
COMMENT ON COLUMN alert_notifications.alert_type IS 'Type of alert triggered';
COMMENT ON COLUMN alert_notifications.severity IS 'Alert urgency level';
COMMENT ON COLUMN alert_notifications.dedup_key IS 'Hash key to prevent duplicate alerts (e.g., "competitor:123:permit:456")';
COMMENT ON COLUMN alert_notifications.details IS 'Additional structured data about the alert (distances, changes, etc.)';

-- ============================================================================
-- TABLE: alert_rules
-- Purpose: Configurable rules for generating alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
    id BIGSERIAL PRIMARY KEY,
    
    -- Rule identification
    rule_name TEXT NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    
    -- Rule type and configuration
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'new_permit_by_competitor',
        'permit_near_location',
        'permit_revision',
        'permit_expiring_soon',
        'hotspot_threshold',
        'custom_query'
    )),
    
    -- Rule parameters (JSON configuration)
    parameters JSONB NOT NULL,
    -- Examples:
    -- {"competitor_ids": ["uuid1", "uuid2"], "priority": "high"}
    -- {"location": {"lat": 27.9, "lon": -82.3}, "radius_miles": 5}
    -- {"days_before_expiration": 30}
    -- {"hotspot_score_threshold": 7.5}
    
    -- Alert settings
    alert_severity TEXT CHECK (alert_severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
    delivery_methods TEXT[] DEFAULT ARRAY['dashboard'], -- ['email', 'slack', 'webhook', 'dashboard']
    
    -- Email configuration
    email_recipients TEXT[],
    email_template TEXT,
    
    -- Webhook configuration
    webhook_url TEXT,
    webhook_headers JSONB,
    
    -- Rate limiting
    max_alerts_per_day INTEGER DEFAULT 100,
    cooldown_minutes INTEGER DEFAULT 60, -- Min time between duplicate alerts
    
    -- Metadata
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    total_triggers INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_rule_type ON alert_rules(rule_type);

-- Add comments
COMMENT ON TABLE alert_rules IS 'Configurable rules for automatic alert generation';
COMMENT ON COLUMN alert_rules.parameters IS 'JSON configuration specific to each rule type';
COMMENT ON COLUMN alert_rules.cooldown_minutes IS 'Minimum time between alerts for same trigger';

-- ============================================================================
-- FUNCTION: create_alert
-- Purpose: Create a new alert notification with deduplication
-- ============================================================================

CREATE OR REPLACE FUNCTION create_alert(
    p_alert_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_message TEXT,
    p_competitor_id BIGINT DEFAULT NULL,
    p_permit_id BIGINT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_delivery_methods TEXT[] DEFAULT ARRAY['dashboard'],
    p_dedup_key TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_alert_id BIGINT;
    v_dedup_key TEXT;
BEGIN
    -- Generate deduplication key if not provided
    v_dedup_key := COALESCE(
        p_dedup_key,
        MD5(p_alert_type || ':' || COALESCE(p_competitor_id::TEXT, '') || ':' || COALESCE(p_permit_id::TEXT, ''))
    );
    
    -- Check if alert already exists (within last 24 hours)
    IF EXISTS (
        SELECT 1 FROM alert_notifications
        WHERE dedup_key = v_dedup_key
        AND created_at >= NOW() - INTERVAL '24 hours'
    ) THEN
        RAISE NOTICE 'Duplicate alert suppressed: %', v_dedup_key;
        RETURN NULL;
    END IF;
    
    -- Create alert
    INSERT INTO alert_notifications (
        alert_type,
        severity,
        title,
        message,
        competitor_id,
        permit_id,
        details,
        delivery_method,
        dedup_key,
        expires_at
    ) VALUES (
        p_alert_type,
        p_severity,
        p_title,
        p_message,
        p_competitor_id,
        p_permit_id,
        p_details,
        p_delivery_methods,
        v_dedup_key,
        NOW() + INTERVAL '30 days' -- Auto-expire after 30 days
    )
    RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_alert IS 'Create alert with automatic deduplication';

-- ============================================================================
-- FUNCTION: check_competitor_alert_rules
-- Purpose: Check all alert rules for a new competitor permit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_competitor_alert_rules(
    p_permit_id BIGINT
)
RETURNS INTEGER AS $$
DECLARE
    v_permit RECORD;
    v_rule RECORD;
    v_competitor RECORD;
    v_alerts_created INTEGER := 0;
    v_alert_id BIGINT;
BEGIN
    -- Get permit details
    SELECT p.*, m.competitor_id, m.match_confidence
    INTO v_permit
    FROM erp_permits p
    LEFT JOIN competitor_permit_matches m ON m.permit_id = p.id
    WHERE p.id = p_permit_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Check if this permit matches any watched competitor
    IF v_permit.competitor_id IS NOT NULL THEN
        SELECT * INTO v_competitor
        FROM competitor_watchlist
        WHERE id = v_permit.competitor_id
        AND alert_enabled = true;
        
        IF FOUND THEN
            -- Create alert for new competitor permit
            v_alert_id := create_alert(
                'new_competitor_permit',
                CASE v_competitor.priority_level
                    WHEN 'critical' THEN 'critical'
                    WHEN 'high' THEN 'warning'
                    ELSE 'info'
                END,
                'New Permit: ' || v_competitor.company_name,
                format(
                    'Competitor %s filed permit %s for project: %s',
                    v_competitor.company_name,
                    v_permit.permit_number,
                    COALESCE(v_permit.project_name, 'Unknown')
                ),
                v_competitor.id,
                v_permit.id,
                jsonb_build_object(
                    'applicant', v_permit.applicant_name,
                    'project', v_permit.project_name,
                    'county', v_permit.county,
                    'acreage', v_permit.acreage,
                    'match_confidence', v_permit.match_confidence
                ),
                ARRAY['dashboard', 'email']
            );
            
            IF v_alert_id IS NOT NULL THEN
                v_alerts_created := v_alerts_created + 1;
            END IF;
        END IF;
    END IF;
    
    -- Check location-based alert rules
    FOR v_rule IN 
        SELECT * FROM alert_rules
        WHERE enabled = true
        AND rule_type = 'permit_near_location'
        AND (parameters->>'radius_miles')::NUMERIC IS NOT NULL
    LOOP
        -- Check if permit is within radius
        IF ST_DWithin(
            v_permit.location::geography,
            ST_SetSRID(
                ST_MakePoint(
                    (v_rule.parameters->'location'->>'lon')::NUMERIC,
                    (v_rule.parameters->'location'->>'lat')::NUMERIC
                ),
                4326
            )::geography,
            (v_rule.parameters->>'radius_miles')::NUMERIC * 1609.34
        ) THEN
            v_alert_id := create_alert(
                'competitor_near_location',
                v_rule.alert_severity,
                'Permit Near Watched Location',
                format(
                    'New permit %s filed within %s miles of %s',
                    v_permit.permit_number,
                    v_rule.parameters->>'radius_miles',
                    v_rule.rule_name
                ),
                NULL,
                v_permit.id,
                jsonb_build_object(
                    'rule_name', v_rule.rule_name,
                    'radius_miles', v_rule.parameters->>'radius_miles',
                    'applicant', v_permit.applicant_name,
                    'project', v_permit.project_name
                ),
                v_rule.delivery_methods
            );
            
            IF v_alert_id IS NOT NULL THEN
                v_alerts_created := v_alerts_created + 1;
                
                -- Update rule statistics
                UPDATE alert_rules
                SET 
                    last_triggered_at = NOW(),
                    total_triggers = total_triggers + 1
                WHERE id = v_rule.id;
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_alerts_created;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_competitor_alert_rules IS 'Evaluate alert rules for a new permit and create notifications';

-- ============================================================================
-- FUNCTION: get_pending_alerts
-- Purpose: Retrieve unacknowledged alerts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_alerts(
    p_severity TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    alert_type TEXT,
    severity TEXT,
    title TEXT,
    message TEXT,
    company_name TEXT,
    permit_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    age_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.alert_type,
        a.severity,
        a.title,
        a.message,
        c.company_name,
        p.permit_number,
        a.created_at,
        ROUND(EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 3600, 1) as age_hours
    FROM alert_notifications a
    LEFT JOIN competitor_watchlist c ON c.id = a.competitor_id
    LEFT JOIN erp_permits p ON p.id = a.permit_id
    WHERE a.acknowledged = false
    AND a.status IN ('pending', 'sent')
    AND (p_severity IS NULL OR a.severity = p_severity)
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    ORDER BY 
        CASE a.severity
            WHEN 'critical' THEN 1
            WHEN 'warning' THEN 2
            WHEN 'info' THEN 3
        END,
        a.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_pending_alerts IS 'Get unacknowledged alerts sorted by severity and date';

-- ============================================================================
-- FUNCTION: acknowledge_alert
-- Purpose: Mark an alert as acknowledged
-- ============================================================================

CREATE OR REPLACE FUNCTION acknowledge_alert(
    p_alert_id BIGINT,
    p_acknowledged_by TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE alert_notifications
    SET 
        acknowledged = true,
        acknowledged_by = p_acknowledged_by,
        acknowledged_at = NOW(),
        status = 'acknowledged'
    WHERE id = p_alert_id
    AND acknowledged = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION acknowledge_alert IS 'Mark alert as acknowledged by user';

-- ============================================================================
-- TRIGGER: Check alerts on new competitor match
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_check_alerts_on_match()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM check_competitor_alert_rules(NEW.permit_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_alert_on_competitor_match ON competitor_permit_matches;
CREATE TRIGGER trigger_alert_on_competitor_match
    AFTER INSERT ON competitor_permit_matches
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_alerts_on_match();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

-- Alert notifications policies
DROP POLICY IF EXISTS "Allow authenticated read access to alerts" ON alert_notifications;
CREATE POLICY "Allow authenticated read access to alerts"
    ON alert_notifications
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow service role full access to alerts" ON alert_notifications;
CREATE POLICY "Allow service role full access to alerts"
    ON alert_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Alert rules policies
DROP POLICY IF EXISTS "Allow authenticated read access to rules" ON alert_rules;
CREATE POLICY "Allow authenticated read access to rules"
    ON alert_rules
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow service role full access to rules" ON alert_rules;
CREATE POLICY "Allow service role full access to rules"
    ON alert_rules
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
    v_trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables 
    WHERE table_name IN ('alert_notifications', 'alert_rules');
    
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'create_alert',
        'check_competitor_alert_rules',
        'get_pending_alerts',
        'acknowledge_alert'
    );
    
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger
    WHERE tgname = 'trigger_alert_on_competitor_match';
    
    IF v_table_count = 2 AND v_function_count = 4 AND v_trigger_count = 1 THEN
        RAISE NOTICE 'Migration 006 completed successfully. Created 2 tables, 4 functions, and 1 trigger.';
    ELSE
        RAISE EXCEPTION 'Migration 006 failed. Found % tables (expected 2), % functions (expected 4), and % triggers (expected 1)', 
            v_table_count, v_function_count, v_trigger_count;
    END IF;
END $$;
