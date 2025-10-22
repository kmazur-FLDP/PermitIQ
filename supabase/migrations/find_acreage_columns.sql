-- First, let's check what columns exist
-- Run this query to see all columns in erp_permits:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'erp_permits' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Then look for columns containing 'acre' or 'acreage'
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'erp_permits' 
  AND table_schema = 'public'
  AND column_name LIKE '%acre%';
