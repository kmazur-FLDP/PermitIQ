-- Diagnostic query to find the actual column names in erp_permits table
-- Run this in your Supabase SQL Editor

-- 1. List ALL columns in erp_permits
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'erp_permits'
ORDER BY ordinal_position;

-- 2. Find any columns with 'acre' in the name
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'erp_permits'
  AND column_name ILIKE '%acre%';

-- 3. Sample a few records to see what data exists
SELECT 
    permit_number,
    -- Try different possible column names:
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_permits' AND column_name='total_acreage') 
        THEN (SELECT total_acreage FROM erp_permits LIMIT 1)
    END as check_total_acreage,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_permits' AND column_name='acreage') 
        THEN (SELECT acreage FROM erp_permits LIMIT 1)
    END as check_acreage
FROM erp_permits 
LIMIT 5;
