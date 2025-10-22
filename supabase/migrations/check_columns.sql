-- Check what columns exist in erp_permits table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'erp_permits'
ORDER BY ordinal_position;
