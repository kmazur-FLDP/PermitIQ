-- Check coordinate data availability

-- 1. How many permits have coordinates?
SELECT 
  COUNT(*) as total_permits,
  COUNT(latitude) as has_latitude,
  COUNT(longitude) as has_longitude,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as has_both_coords
FROM erp_permits;

-- 2. Sample some coordinates
SELECT 
  permit_number,
  applicant_name,
  latitude,
  longitude,
  address
FROM erp_permits 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
LIMIT 10;

-- 3. Check the PostGIS geometry columns
SELECT 
  COUNT(location) as has_location,
  COUNT(geometry) as has_geometry
FROM erp_permits;

-- 4. Sample PostGIS data
SELECT 
  permit_number,
  ST_AsText(location) as location_wkt,
  ST_AsText(geometry) as geometry_wkt,
  ST_Y(location::geometry) as lat_from_location,
  ST_X(location::geometry) as lon_from_location
FROM erp_permits 
WHERE location IS NOT NULL
LIMIT 5;
