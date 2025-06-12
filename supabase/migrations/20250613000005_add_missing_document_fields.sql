-- Add missing document fields to passport_applications table
-- This migration adds support for new document upload fields:
-- 1. Social Security Card/Number with URL
-- 2. Passport Photo with URL  
-- 3. Relationship Proof with URL
-- 4. Parent/Guardian Identification with URL

-- Add social_security_card and social_security_card_url columns
ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS social_security_card character varying(255) NULL;

ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS social_security_card_url character varying(512) NULL;

-- Add passport_photo and passport_photo_url columns
ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS passport_photo character varying(255) NULL;

ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS passport_photo_url character varying(512) NULL;

-- Add relationship_proof and relationship_proof_url columns
ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS relationship_proof character varying(255) NULL;

ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS relationship_proof_url character varying(512) NULL;

-- Add parent_guardian_id and parent_guardian_id_url columns
ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS parent_guardian_id character varying(255) NULL;

ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS parent_guardian_id_url character varying(512) NULL;

-- Add indexes for better query performance on URL fields
CREATE INDEX IF NOT EXISTS idx_passport_applications_social_security_card_url 
ON public.passport_applications USING btree (social_security_card_url) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_passport_applications_passport_photo_url 
ON public.passport_applications USING btree (passport_photo_url) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_passport_applications_relationship_proof_url 
ON public.passport_applications USING btree (relationship_proof_url) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_passport_applications_parent_guardian_id_url 
ON public.passport_applications USING btree (parent_guardian_id_url) 
TABLESPACE pg_default;

-- Add comments to document the new fields
COMMENT ON COLUMN public.passport_applications.social_security_card 
IS 'Filename of uploaded social security card document';

COMMENT ON COLUMN public.passport_applications.social_security_card_url 
IS 'URL of uploaded social security card document in storage';

COMMENT ON COLUMN public.passport_applications.passport_photo 
IS 'Filename of uploaded passport photo';

COMMENT ON COLUMN public.passport_applications.passport_photo_url 
IS 'URL of uploaded passport photo in storage';

COMMENT ON COLUMN public.passport_applications.relationship_proof 
IS 'Filename of uploaded relationship proof document';

COMMENT ON COLUMN public.passport_applications.relationship_proof_url 
IS 'URL of uploaded relationship proof document in storage';

COMMENT ON COLUMN public.passport_applications.parent_guardian_id 
IS 'Filename of uploaded parent/guardian identification document';

COMMENT ON COLUMN public.passport_applications.parent_guardian_id_url 
IS 'URL of uploaded parent/guardian identification document in storage';
