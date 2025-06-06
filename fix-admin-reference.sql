-- Fix for the foreign key constraint issue with last_modified_by_admin_id

-- First check if the constraint exists and drop it
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'passport_applications_last_modified_by_admin_id_fkey'
        AND table_name = 'passport_applications'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        EXECUTE 'ALTER TABLE public.passport_applications DROP CONSTRAINT passport_applications_last_modified_by_admin_id_fkey;';
    END IF;
END$$;

-- Add the constraint with ON DELETE SET NULL
-- This will set last_modified_by_admin_id to NULL when the referenced user is deleted
ALTER TABLE public.passport_applications
ADD CONSTRAINT passport_applications_last_modified_by_admin_id_fkey
FOREIGN KEY (last_modified_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- The SET NULL approach is safer than CASCADE as it preserves the application record
-- It just removes the reference to the deleted admin
