-- Migration script to add commenting functionality
-- Run this in your Supabase SQL editor

-- Create application_comments table
CREATE TABLE IF NOT EXISTS public.application_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.passport_applications(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.application_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to insert comments
CREATE POLICY "Admins can insert comments" ON public.application_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow admins to view all comments
CREATE POLICY "Admins can view all comments" ON public.application_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow admins to update their own comments
CREATE POLICY "Admins can update their own comments" ON public.application_comments
    FOR UPDATE USING (
        admin_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow admins to delete their own comments
CREATE POLICY "Admins can delete their own comments" ON public.application_comments
    FOR DELETE USING (
        admin_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_comments_application_id ON public.application_comments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_comments_created_at ON public.application_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_application_comments_admin_id ON public.application_comments(admin_id);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on comments
CREATE TRIGGER update_application_comments_updated_at 
    BEFORE UPDATE ON public.application_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
