-- Add missing ID column to messages table
-- This script adds the primary key ID column that the React components expect

-- Add ID column as primary key if it doesn't exist
DO $$ 
BEGIN
    -- Check if id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'id'
    ) THEN
        -- Add id column with UUID default
        ALTER TABLE public.messages 
        ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        
        -- Update existing rows to have UUIDs
        UPDATE public.messages SET id = gen_random_uuid() WHERE id IS NULL;
        
        RAISE NOTICE 'Added id column to messages table';
    ELSE
        RAISE NOTICE 'ID column already exists in messages table';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;
