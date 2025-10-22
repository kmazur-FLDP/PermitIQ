-- Check what keys exist in raw_data JSON

-- 1. Get the keys from raw_data for one record
SELECT jsonb_object_keys(raw_data) as available_keys
FROM erp_permits 
WHERE raw_data IS NOT NULL
LIMIT 1;

-- 2. Look at the full raw_data structure
SELECT raw_data
FROM erp_permits 
WHERE raw_data IS NOT NULL
LIMIT 1;

-- 3. Check if there's a city field we could use instead
SELECT 
  permit_number,
  city,
  raw_data->>'city' as city_from_json,
  raw_data->>'CITY' as city_from_json_upper
FROM erp_permits 
WHERE raw_data IS NOT NULL
LIMIT 10;
