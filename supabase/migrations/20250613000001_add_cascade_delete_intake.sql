-- Add foreign key constraint with CASCADE DELETE to application_intake table
-- This ensures that when a passport application is deleted, 
-- the corresponding intake record is also automatically deleted

-- First, add the foreign key constraint if it doesn't exist
-- (Check if constraint already exists to avoid errors)
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'application_intake_passport_application_id_fkey'
        AND table_name = 'application_intake'
    ) THEN
        -- Add foreign key constraint with CASCADE DELETE
        ALTER TABLE application_intake 
        ADD CONSTRAINT application_intake_passport_application_id_fkey 
        FOREIGN KEY (passport_application_id) 
        REFERENCES passport_applications(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add comment to document the purpose
COMMENT ON CONSTRAINT application_intake_passport_application_id_fkey ON application_intake 
IS 'Foreign key constraint with CASCADE DELETE - automatically deletes intake records when passport application is deleted';
