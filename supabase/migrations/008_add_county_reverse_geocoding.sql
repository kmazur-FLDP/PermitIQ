-- Step 1: Create Florida counties boundary table
-- This will store county polygons for reverse geocoding

CREATE TABLE IF NOT EXISTS florida_counties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  geom GEOMETRY(MULTIPOLYGON, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_florida_counties_geom ON florida_counties USING GIST (geom);

-- Step 2: Insert Florida county boundaries
-- Using simplified boundaries for SWFWMD region counties
-- These are approximate bounding boxes - you can replace with accurate GeoJSON later

INSERT INTO florida_counties (name, geom) VALUES
-- Major SWFWMD counties with approximate boundaries (wrapped as MULTIPOLYGON)
('Hillsborough', ST_Multi(ST_GeomFromText('POLYGON((-82.7 27.7, -82.2 27.7, -82.2 28.2, -82.7 28.2, -82.7 27.7))', 4326))),
('Pinellas', ST_Multi(ST_GeomFromText('POLYGON((-82.9 27.6, -82.6 27.6, -82.6 28.2, -82.9 28.2, -82.9 27.6))', 4326))),
('Pasco', ST_Multi(ST_GeomFromText('POLYGON((-82.8 28.1, -82.3 28.1, -82.3 28.5, -82.8 28.5, -82.8 28.1))', 4326))),
('Polk', ST_Multi(ST_GeomFromText('POLYGON((-82.2 27.5, -81.5 27.5, -81.5 28.3, -82.2 28.3, -82.2 27.5))', 4326))),
('Manatee', ST_Multi(ST_GeomFromText('POLYGON((-82.8 27.2, -82.2 27.2, -82.2 27.7, -82.8 27.7, -82.8 27.2))', 4326))),
('Sarasota', ST_Multi(ST_GeomFromText('POLYGON((-82.8 26.9, -82.2 26.9, -82.2 27.4, -82.8 27.4, -82.8 26.9))', 4326))),
('Hernando', ST_Multi(ST_GeomFromText('POLYGON((-82.8 28.4, -82.3 28.4, -82.3 28.8, -82.8 28.8, -82.8 28.4))', 4326))),
('Citrus', ST_Multi(ST_GeomFromText('POLYGON((-82.9 28.7, -82.3 28.7, -82.3 29.1, -82.9 29.1, -82.9 28.7))', 4326))),
('Sumter', ST_Multi(ST_GeomFromText('POLYGON((-82.3 28.6, -81.9 28.6, -81.9 29.0, -82.3 29.0, -82.3 28.6))', 4326))),
('Lake', ST_Multi(ST_GeomFromText('POLYGON((-82.0 28.5, -81.4 28.5, -81.4 29.0, -82.0 29.0, -82.0 28.5))', 4326))),
('Marion', ST_Multi(ST_GeomFromText('POLYGON((-82.6 28.9, -81.9 28.9, -81.9 29.5, -82.6 29.5, -82.6 28.9))', 4326))),
('Levy', ST_Multi(ST_GeomFromText('POLYGON((-83.2 29.0, -82.6 29.0, -82.6 29.6, -83.2 29.6, -83.2 29.0))', 4326))),
('Charlotte', ST_Multi(ST_GeomFromText('POLYGON((-82.4 26.7, -81.8 26.7, -81.8 27.2, -82.4 27.2, -82.4 26.7))', 4326))),
('DeSoto', ST_Multi(ST_GeomFromText('POLYGON((-82.2 26.9, -81.6 26.9, -81.6 27.4, -82.2 27.4, -82.2 26.9))', 4326))),
('Hardee', ST_Multi(ST_GeomFromText('POLYGON((-82.0 27.3, -81.6 27.3, -81.6 27.7, -82.0 27.7, -82.0 27.3))', 4326)))
ON CONFLICT (name) DO NOTHING;

-- Step 3: Function to get county from coordinates
CREATE OR REPLACE FUNCTION get_county_from_coords(lat NUMERIC, lon NUMERIC)
RETURNS VARCHAR(100)
LANGUAGE sql
STABLE
AS $$
  SELECT name
  FROM florida_counties
  WHERE ST_Within(
    ST_SetSRID(ST_MakePoint(lon, lat), 4326),
    geom
  )
  LIMIT 1;
$$;

-- Step 4: Update existing permits with county data
UPDATE erp_permits
SET county = get_county_from_coords(latitude, longitude)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL
  AND county IS NULL;

-- Step 5: Check results
SELECT 
  county,
  COUNT(*) as permit_count
FROM erp_permits
WHERE county IS NOT NULL
GROUP BY county
ORDER BY permit_count DESC;

-- Step 6: Create trigger to auto-populate county for new/updated permits
CREATE OR REPLACE FUNCTION set_county_from_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.county := get_county_from_coords(NEW.latitude, NEW.longitude);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_county ON erp_permits;
CREATE TRIGGER trigger_set_county
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON erp_permits
  FOR EACH ROW
  EXECUTE FUNCTION set_county_from_location();

GRANT SELECT ON florida_counties TO authenticated;
GRANT SELECT ON florida_counties TO anon;
