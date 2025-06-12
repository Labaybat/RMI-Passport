-- Add specific_relationship column to application_intake table
-- This column stores the specific relationship when users select "guardianship" or "others"

-- Add the new column if it doesn't exist
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'application_intake' 
        AND column_name = 'specific_relationship'
    ) THEN
        -- Add the specific_relationship column
        ALTER TABLE application_intake 
        ADD COLUMN specific_relationship text;
    END IF;
END $$;

-- Add comment to document the purpose
COMMENT ON COLUMN application_intake.specific_relationship 
IS 'Stores the specific relationship details when applicant_relationship is "guardianship" or "others"';
