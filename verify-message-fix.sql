-- Comprehensive verification script for message notification system fix
-- Run this script to verify that the fix is working correctly

-- 1. Check table structure
SELECT 'Table Structure Check' as check_type;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('id', 'read_by_admin', 'read_by_user', 'admin_read_at', 'user_read_at', 'read', 'sender_type', 'application_id')
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT 'Index Check' as check_type;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'messages' 
AND indexname LIKE '%read_by%';

-- 3. Check constraints
SELECT 'Constraint Check' as check_type;
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.messages'::regclass;

-- 4. Sample data check (if any messages exist)
SELECT 'Sample Data Check' as check_type;
SELECT 
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE read_by_admin = TRUE) as read_by_admin_count,
    COUNT(*) FILTER (WHERE read_by_user = TRUE) as read_by_user_count,
    COUNT(*) FILTER (WHERE sender_type = 'admin') as admin_messages,
    COUNT(*) FILTER (WHERE sender_type = 'user') as user_messages,
    COUNT(*) FILTER (WHERE id IS NOT NULL) as messages_with_id,
    COUNT(*) FILTER (WHERE id IS NULL) as messages_without_id
FROM public.messages;

-- 5. Check for any messages that need ID assignment
SELECT 'Messages Without ID' as check_type;
SELECT COUNT(*) as messages_needing_id
FROM public.messages 
WHERE id IS NULL;

-- 6. Check RLS policies
SELECT 'RLS Policy Check' as check_type;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'messages';

-- 7. Test query patterns that the React app will use
SELECT 'Admin Unread Count Test' as check_type;
SELECT 
    application_id,
    COUNT(*) as unread_user_messages_for_admin
FROM public.messages 
WHERE sender_type = 'user' 
AND read_by_admin = FALSE
GROUP BY application_id
LIMIT 5;

SELECT 'User Unread Count Test' as check_type;
SELECT 
    application_id,
    COUNT(*) as unread_admin_messages_for_user
FROM public.messages 
WHERE sender_type = 'admin' 
AND read_by_user = FALSE  
GROUP BY application_id
LIMIT 5;

-- 8. Verify trigger exists
SELECT 'Trigger Check' as check_type;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages';
