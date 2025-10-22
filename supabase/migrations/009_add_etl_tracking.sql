-- Migration: Add ETL tracking table for admin dashboard

-- 1. Create ETL runs tracking table
CREATE TABLE IF NOT EXISTS etl_runs (
  id SERIAL PRIMARY KEY,
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'running'
  records_fetched INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_etl_runs_run_date ON etl_runs(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_etl_runs_status ON etl_runs(status);

-- 2. Grant permissions
GRANT SELECT ON etl_runs TO authenticated;
GRANT INSERT ON etl_runs TO service_role;

-- 3. Function to get latest ETL stats
CREATE OR REPLACE FUNCTION get_etl_stats()
RETURNS TABLE (
  last_run_date TIMESTAMPTZ,
  last_run_status VARCHAR(50),
  last_records_updated INTEGER,
  total_runs_today INTEGER,
  total_runs_this_week INTEGER,
  avg_duration_seconds NUMERIC,
  success_rate NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT run_date FROM etl_runs ORDER BY run_date DESC LIMIT 1) as last_run_date,
    (SELECT status FROM etl_runs ORDER BY run_date DESC LIMIT 1) as last_run_status,
    (SELECT records_updated FROM etl_runs ORDER BY run_date DESC LIMIT 1) as last_records_updated,
    (SELECT COUNT(*) FROM etl_runs WHERE run_date >= NOW() - INTERVAL '1 day')::INTEGER as total_runs_today,
    (SELECT COUNT(*) FROM etl_runs WHERE run_date >= NOW() - INTERVAL '7 days')::INTEGER as total_runs_this_week,
    (SELECT AVG(duration_seconds) FROM etl_runs WHERE run_date >= NOW() - INTERVAL '7 days') as avg_duration_seconds,
    (SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*) * 100)
      END
     FROM etl_runs 
     WHERE run_date >= NOW() - INTERVAL '30 days'
    ) as success_rate;
$$;

GRANT EXECUTE ON FUNCTION get_etl_stats() TO authenticated;

-- 4. Function to get recent ETL runs
CREATE OR REPLACE FUNCTION get_recent_etl_runs(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id INTEGER,
  run_date TIMESTAMPTZ,
  status VARCHAR(50),
  records_fetched INTEGER,
  records_inserted INTEGER,
  records_updated INTEGER,
  records_failed INTEGER,
  duration_seconds INTEGER,
  error_message TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    run_date,
    status,
    records_fetched,
    records_inserted,
    records_updated,
    records_failed,
    duration_seconds,
    error_message
  FROM etl_runs
  ORDER BY run_date DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION get_recent_etl_runs(INTEGER) TO authenticated;

-- 5. Insert a sample ETL run for testing
INSERT INTO etl_runs (status, records_fetched, records_inserted, records_updated, duration_seconds)
VALUES ('success', 40382, 0, 40382, 245);
