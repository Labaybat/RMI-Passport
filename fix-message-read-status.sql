-- Fix message read status tracking
-- This SQL script enhances the messages table to properly track read status per role

-- First, ensure the messages table exists with proper structure
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.passport_applications(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE, -- Keep for backward compatibility, will phase out
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sender_name TEXT -- For caching sender names
);

-- Add new columns for proper read status tracking
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_by_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_read_at TIMESTAMP WITH TIME ZONE;

-- Add index for sender_name if it doesn't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON public.messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON public.messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_read_by_admin ON public.messages(read_by_admin);
CREATE INDEX IF NOT EXISTS idx_messages_read_by_user ON public.messages(read_by_user);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view messages for their own applications
CREATE POLICY IF NOT EXISTS "Users can view messages for their applications" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.passport_applications 
            WHERE passport_applications.id = messages.application_id 
            AND passport_applications.user_id = auth.uid()
        )
    );

-- Policy: Allow users to insert messages for their own applications
CREATE POLICY IF NOT EXISTS "Users can insert messages for their applications" ON public.messages
    FOR INSERT WITH CHECK (
        sender_type = 'user' AND
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.passport_applications 
            WHERE passport_applications.id = messages.application_id 
            AND passport_applications.user_id = auth.uid()
        )
    );

-- Policy: Allow users to update read status for their own applications
CREATE POLICY IF NOT EXISTS "Users can update read status for their applications" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.passport_applications 
            WHERE passport_applications.id = messages.application_id 
            AND passport_applications.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.passport_applications 
            WHERE passport_applications.id = messages.application_id 
            AND passport_applications.user_id = auth.uid()
        )
    );

-- Policy: Allow admins to view all messages
CREATE POLICY IF NOT EXISTS "Admins can view all messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow admins to insert messages
CREATE POLICY IF NOT EXISTS "Admins can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        sender_type = 'admin' AND
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow admins to update messages (for read status)
CREATE POLICY IF NOT EXISTS "Admins can update messages" ON public.messages
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

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_messages_updated_at();

-- Migrate existing data: Set read_by_admin and read_by_user based on sender_type and current read status
-- For admin messages that are marked as read, assume they were read by users
UPDATE public.messages 
SET read_by_user = TRUE, user_read_at = updated_at
WHERE sender_type = 'admin' AND read = TRUE AND read_by_user IS NULL;

-- For user messages that are marked as read, assume they were read by admins
UPDATE public.messages 
SET read_by_admin = TRUE, admin_read_at = updated_at
WHERE sender_type = 'user' AND read = TRUE AND read_by_admin IS NULL;

-- Update the schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT 
    'messages' as table_name,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE read_by_admin = TRUE) as read_by_admin_count,
    COUNT(*) FILTER (WHERE read_by_user = TRUE) as read_by_user_count,
    COUNT(*) FILTER (WHERE sender_type = 'admin') as admin_messages,
    COUNT(*) FILTER (WHERE sender_type = 'user') as user_messages
FROM public.messages;
