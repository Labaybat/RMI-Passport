-- Test script to verify admin tracking is working
-- Run this after applying the migration

-- 1. Check if the columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'passport_applications' 
AND column_name IN ('last_modified_by_admin_id', 'last_modified_by_admin_name');

-- 2. Check current applications and their tracking info
SELECT 
    id,
    status,
    surname,
    first_middle_names,
    last_modified_by_admin_id,
    last_modified_by_admin_name,
    updated_at,
    created_at
FROM public.passport_applications 
ORDER BY updated_at DESC 
LIMIT 10;

-- 3. Test updating an application (replace 'your-application-id' and 'your-admin-id')
/*
UPDATE public.passport_applications 
SET 
    status = 'approved',
    last_modified_by_admin_id = 'your-admin-id',
    last_modified_by_admin_name = 'Test Admin'
WHERE id = 'your-application-id';
*/
