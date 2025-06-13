-- Add specific_relationship column and update constraints for application_intake table
-- This migration adds support for:
-- 1. "Others" relationship option
-- 2. Specific relationship field for guardianship and others relationships

-- Add the specific_relationship column
ALTER TABLE public.application_intake 
ADD COLUMN IF NOT EXISTS specific_relationship character varying(100) NULL;

-- Drop the existing check constraint
ALTER TABLE public.application_intake 
DROP CONSTRAINT IF EXISTS application_intake_applicant_relationship_check;

-- Add the updated check constraint that includes 'others'
ALTER TABLE public.application_intake 
ADD CONSTRAINT application_intake_applicant_relationship_check 
CHECK (
  (applicant_relationship)::text = ANY (
    ARRAY[
      'myself'::character varying,
      'child'::character varying,
      'guardianship'::character varying,
      'others'::character varying
    ]::text[]
  )
);

-- Add an index on the new specific_relationship column for better query performance
CREATE INDEX IF NOT EXISTS idx_application_intake_specific_relationship 
ON public.application_intake USING btree (specific_relationship) 
TABLESPACE pg_default;

-- Add comments to document the new functionality
COMMENT ON COLUMN public.application_intake.specific_relationship 
IS 'Specific relationship description when applicant_relationship is "guardianship" or "others"';

COMMENT ON CONSTRAINT application_intake_applicant_relationship_check ON public.application_intake 
IS 'Ensures applicant_relationship is one of: myself, child, guardianship, or others';
