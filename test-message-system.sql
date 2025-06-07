-- Test the message notification system functionality
-- Run this to verify that the enhanced read tracking is working properly

-- 1. Check current message counts by role and read status
SELECT 
    'Current Message Statistics' as test_name,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE sender_type = 'admin') as admin_messages,
    COUNT(*) FILTER (WHERE sender_type = 'user') as user_messages,
    COUNT(*) FILTER (WHERE read_by_admin = true) as read_by_admin,
    COUNT(*) FILTER (WHERE read_by_user = true) as read_by_user,
    COUNT(*) FILTER (WHERE read_by_admin = false OR read_by_admin IS NULL) as unread_by_admin,
    COUNT(*) FILTER (WHERE read_by_user = false OR read_by_user IS NULL) as unread_by_user
FROM public.messages;

-- 2. Check the specific application's messages (replace with actual application_id)
SELECT 
    'Application Messages' as test_name,
    sender_type,
    content,
    read_by_admin,
    read_by_user,
    sender_name,
    created_at
FROM public.messages 
WHERE application_id = (
    SELECT id FROM public.passport_applications 
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY created_at;

-- 3. Test unread count queries that the React app uses
-- Admin unread count (messages from users not read by admin)
SELECT 
    'Admin Unread Count' as query_type,
    COUNT(*) as unread_count
FROM public.messages 
WHERE sender_type = 'user' 
AND (read_by_admin = false OR read_by_admin IS NULL);

-- User unread count (messages from admins not read by user) 
SELECT 
    'User Unread Count' as query_type,
    COUNT(*) as unread_count
FROM public.messages 
WHERE sender_type = 'admin' 
AND (read_by_user = false OR read_by_user IS NULL);

-- 4. Check for any missing foreign key relationships
SELECT 
    'Foreign Key Check' as test_name,
    COUNT(*) as messages_with_invalid_sender_id
FROM public.messages m
LEFT JOIN public.profiles p ON m.sender_id = p.id
WHERE p.id IS NULL;

SELECT 
    'Application FK Check' as test_name,
    COUNT(*) as messages_with_invalid_application_id
FROM public.messages m
LEFT JOIN public.passport_applications pa ON m.application_id = pa.id
WHERE pa.id IS NULL;

-- 5. Verify that all required columns exist
SELECT 
    'Schema Verification' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('read_by_admin', 'read_by_user', 'admin_read_at', 'user_read_at', 'sender_name')
ORDER BY column_name;
