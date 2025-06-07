-- Add sender_name column to messages table
ALTER TABLE messages 
ADD COLUMN sender_name TEXT;

-- Update the schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';
