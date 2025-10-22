-- Check ALL fields to see what has data

SELECT 
  COUNT(*) as total_permits,
  COUNT(permit_number) as has_permit_number,
  COUNT(objectid) as has_objectid,
  COUNT(applicant_name) as has_applicant_name,
  COUNT(company_name) as has_company_name,
  COUNT(permit_type) as has_permit_type,
  COUNT(permit_status) as has_permit_status,
  COUNT(activity_description) as has_activity_description,
  COUNT(application_date) as has_application_date,
  COUNT(issue_date) as has_issue_date,
  COUNT(expiration_date) as has_expiration_date,
  COUNT(last_modified_date) as has_last_modified_date,
  COUNT(county) as has_county,
  COUNT(city) as has_city,
  COUNT(address) as has_address,
  COUNT(latitude) as has_latitude,
  COUNT(longitude) as has_longitude,
  COUNT(project_name) as has_project_name,
  COUNT(project_type) as has_project_type,
  COUNT(acreage) as has_acreage
FROM erp_permits;

-- Sample actual records to see what data exists
SELECT 
  permit_number,
  applicant_name,
  company_name,
  permit_status,
  permit_type,
  acreage
FROM erp_permits 
LIMIT 10;
