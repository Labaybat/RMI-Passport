-- Fix foreign key relationships for passport_applications table
-- This will enable proper joins between passport_applications and profiles

-- First, check if the foreign key constraint already exists
DO $$
BEGIN
    -- Add foreign key constraint for user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'passport_applications_user_id_fkey' 
        AND table_name = 'passport_applications'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.passport_applications
        ADD CONSTRAINT passport_applications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint passport_applications_user_id_fkey added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint passport_applications_user_id_fkey already exists';
    END IF;
END
$$;

-- Create index on user_id for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_passport_applications_user_id 
ON public.passport_applications(user_id);

-- Verify the foreign key relationships
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'passport_applications';