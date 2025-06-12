-- Add new document fields to passport_applications table
-- Migration: 20250613000004_add_relationship_document_fields.sql

-- Add social security card document fields
ALTER TABLE public.passport_applications 
ADD COLUMN social_security_card TEXT NULL,
ADD COLUMN social_security_card_url TEXT NULL;

-- Add passport photo document fields
ALTER TABLE public.passport_applications 
ADD COLUMN passport_photo TEXT NULL,
ADD COLUMN passport_photo_url TEXT NULL;

-- Add relationship proof document fields
ALTER TABLE public.passport_applications 
ADD COLUMN relationship_proof TEXT NULL,
ADD COLUMN relationship_proof_url TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.passport_applications.social_security_card IS 'Filename of social security card/number document';
COMMENT ON COLUMN public.passport_applications.social_security_card_url IS 'Storage URL of social security card/number document';

COMMENT ON COLUMN public.passport_applications.passport_photo IS 'Filename of passport photo document';
COMMENT ON COLUMN public.passport_applications.passport_photo_url IS 'Storage URL of passport photo document';

COMMENT ON COLUMN public.passport_applications.relationship_proof IS 'Filename of relationship proof document';
COMMENT ON COLUMN public.passport_applications.relationship_proof_url IS 'Storage URL of relationship proof document';