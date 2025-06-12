-- Add foreign key constraint with CASCADE DELETE to application_intake table
-- This will automatically delete intake records when passport applications are deleted

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE application_intake 
DROP CONSTRAINT IF EXISTS application_intake_passport_application_id_fkey;

-- Add the new foreign key constraint with CASCADE DELETE
ALTER TABLE application_intake 
ADD CONSTRAINT application_intake_passport_application_id_fkey 
FOREIGN KEY (passport_application_id) 
REFERENCES passport_applications(id) 
ON DELETE CASCADE;

-- Optional: Add an index for better performance on the foreign key
CREATE INDEX IF NOT EXISTS idx_application_intake_passport_application_id 
ON application_intake(passport_application_id);
