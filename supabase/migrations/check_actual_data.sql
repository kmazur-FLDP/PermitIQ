-- Check what data actually exists in the table

-- 1. Count total permits
SELECT COUNT(*) as total_permits FROM erp_permits;

-- 2. Check which fields have data
SELECT 
  COUNT(*) as total_rows,
  COUNT(county) as has_county,
  COUNT(city) as has_city,
  COUNT(applicant_name) as has_applicant,
  COUNT(company_name) as has_company,
  COUNT(permit_status) as has_status,
  COUNT(acreage) as has_acreage,
  COUNT(issue_date) as has_issue_date
FROM erp_permits;

-- 3. Sample the raw data to see what we have
SELECT 
  permit_number,
  county,
  city,
  applicant_name,
  permit_status,
  acreage,
  raw_data::text
FROM erp_permits 
LIMIT 5;

-- 4. Check if county data is in raw_data JSON
SELECT 
  permit_number,
  raw_data->>'county' as county_from_json,
  raw_data->>'COUNTY' as county_from_json_upper,
  raw_data->>'County' as county_from_json_title
FROM erp_permits 
WHERE raw_data IS NOT NULL
LIMIT 10;
