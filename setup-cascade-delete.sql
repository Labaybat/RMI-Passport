-- SQL script to set up cascade delete relationship between auth.users and public.profiles
-- This ensures that when a user is deleted from auth.users, their profile is also deleted

-- First check if the constraint exists and drop it if it does
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add the constraint with ON DELETE CASCADE
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Similarly, ensure other user-related tables have cascade delete constraints
-- For example, passport applications
ALTER TABLE public.passport_applications
DROP CONSTRAINT IF EXISTS passport_applications_user_id_fkey;

ALTER TABLE public.passport_applications
ADD CONSTRAINT passport_applications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For application comments
ALTER TABLE public.application_comments
DROP CONSTRAINT IF EXISTS application_comments_user_id_fkey;

ALTER TABLE public.application_comments
ADD CONSTRAINT application_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For admin comments (if admin_id references auth.users)
ALTER TABLE public.application_comments
DROP CONSTRAINT IF EXISTS application_comments_admin_id_fkey;

ALTER TABLE public.application_comments
ADD CONSTRAINT application_comments_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add any other tables that reference auth.users following the same pattern
