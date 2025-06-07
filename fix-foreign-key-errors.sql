-- Fix for join query errors and foreign key issues
-- This script fixes the foreign key references to match your actual table structure

-- First, let's fix the foreign key reference issue
-- Your current schema references auth.users but you're using profiles table

-- Drop the existing foreign key constraint that's causing issues
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Add the correct foreign key constraint to reference profiles table
ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Make sure the application_id foreign key is also correct
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS fk_application;
ALTER TABLE public.messages 
ADD CONSTRAINT fk_application 
FOREIGN KEY (application_id) REFERENCES public.passport_applications(id) ON DELETE CASCADE;

-- Verify the updated schema
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='messages';

-- Also ensure RLS policies are updated to work with the profiles table
-- Update the admin policy to correctly reference profiles table
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
CREATE POLICY "Admins can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        sender_type = 'admin' AND
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;
CREATE POLICY "Admins can update messages" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Refresh the schema to ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload schema';

-- Quick test to ensure everything is working
SELECT 'Schema fix applied successfully' AS status;
