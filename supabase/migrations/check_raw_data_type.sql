-- Check raw_data type and content

-- 1. See what raw_data actually contains
SELECT 
  permit_number,
  raw_data,
  pg_typeof(raw_data) as data_type,
  jsonb_typeof(raw_data) as jsonb_type
FROM erp_permits 
WHERE raw_data IS NOT NULL
LIMIT 5;

-- 2. Check all the populated fields
SELECT 
  permit_number,
  applicant_name,
  company_name,
  permit_type,
  permit_status,
  city,
  address,
  acreage,
  latitude,
  longitude
FROM erp_permits 
LIMIT 10;
