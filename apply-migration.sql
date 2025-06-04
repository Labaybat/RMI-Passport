-- Apply admin tracking columns to passport_applications table
-- Run this script against your Supabase database

-- Add columns to track last admin who modified the application
ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS last_modified_by_admin_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS last_modified_by_admin_name TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_passport_applications_last_modified_by_admin_id 
ON public.passport_applications(last_modified_by_admin_id);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'passport_applications' 
AND column_name IN ('last_modified_by_admin_id', 'last_modified_by_admin_name');
