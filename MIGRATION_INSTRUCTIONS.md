# Message Notification System Fix - Migration Instructions

## Overview
This update fixes the message notification issues where:
1. Message badges disappear when clicking the message button
2. Message badges reappear after page refresh even though they were read
3. React hook errors when opening message modal
4. **CRITICAL FIX**: Ensures that read messages stay read across page refreshes using role-specific read tracking

## Database Migration Required

### Step 1: Apply Database Schema Changes
Run the provided SQL migration script to add role-specific read tracking columns:

```bash
# Replace 'yourdbname', 'postgres', and connection details with your actual database info
psql -h localhost -U postgres -d yourdbname -f fix-message-read-status.sql
```

**Important**: If you don't have psql command line tool, you can:
1. Copy the contents of `fix-message-read-status.sql`
2. Run it directly in your database management tool (pgAdmin, DBeaver, etc.)
3. Or run it through your hosting provider's database interface

### Step 2: Verify Migration Success
After running the migration, verify that the new columns exist:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('read_by_admin', 'read_by_user', 'admin_read_at', 'user_read_at');
```

You should see 4 new columns:
- `read_by_admin` (boolean)
- `read_by_user` (boolean) 
- `admin_read_at` (timestamp with time zone)
- `user_read_at` (timestamp with time zone)

## Changes Made

### Database Schema (`fix-message-read-status.sql`)
- ✅ Added `read_by_admin` and `read_by_user` boolean columns for role-specific read tracking
- ✅ Added `admin_read_at` and `user_read_at` timestamp columns for read tracking
- ✅ Enhanced RLS policies for proper access control
- ✅ Added performance indexes
- ✅ Migration script to update existing data
- ✅ Backward compatibility maintenance

### MessageModal.tsx
- ✅ Enhanced Message interface with new read status fields
- ✅ Fixed `markUserMessagesAsRead` function to use role-specific read tracking
- ✅ Updated unread count calculation to use new role-specific read status
- ✅ Updated `sendMessage` function to initialize new messages with proper read status
- ✅ Maintained refs for avoiding stale closures in real-time subscriptions

### AdminPage.tsx
- ✅ Updated unread count queries to use `read_by_admin` instead of generic `read` column
- ✅ Updated real-time subscription UPDATE event handler to track admin read status
- ✅ Fixed message count refresh logic to use new read status tracking

### MyApplicationsPage.tsx
- ✅ Updated unread count queries to use `read_by_user` instead of generic `read` column  
- ✅ Updated real-time subscription UPDATE event handler to track user read status
- ✅ Fixed message count refresh logic to use new read status tracking

## How The Fix Works

### Before (Problem):
- Single `read` boolean column couldn't distinguish between admin vs user read status
- When admin read a message, it was marked as read for everyone
- When user read a message, it was marked as read for everyone
- Page refresh would show notifications again because read status was ambiguous

### After (Solution):
- **Role-specific read tracking**: `read_by_admin` and `read_by_user` columns
- **Proper read status**: Admins only mark messages as `read_by_admin`, users only mark as `read_by_user`
- **Persistent read status**: Once an admin reads a message, `read_by_admin` stays true permanently
- **Independent tracking**: Admin and user read status are completely independent
- **Real-time updates**: Subscription handlers properly update counts based on role-specific read status

### Example Scenarios:
1. **Admin sends message to user**: 
   - `read_by_admin = false`, `read_by_user = false`
   - User sees notification badge
   - When user opens modal: `read_by_user = true`, badge disappears
   - Page refresh: Badge stays gone because `read_by_user = true`

2. **User sends message to admin**:
   - `read_by_admin = false`, `read_by_user = false` 
   - Admin sees notification badge
   - When admin opens modal: `read_by_admin = true`, badge disappears
   - Page refresh: Badge stays gone because `read_by_admin = true`

## Testing Checklist

After applying the migration, test these scenarios:

### Admin Testing:
- [ ] Admin receives notification when user sends message
- [ ] Badge count shows correctly in admin dashboard
- [ ] Opening message modal clears the badge
- [ ] Page refresh keeps badge cleared
- [ ] New messages from users show new badges
- [ ] Real-time updates work correctly

### User Testing:
- [ ] User receives notification when admin sends message  
- [ ] Badge count shows correctly in user applications page
- [ ] Opening message modal clears the badge
- [ ] Page refresh keeps badge cleared
- [ ] New messages from admin show new badges
- [ ] Real-time updates work correctly

### Cross-Role Testing:
- [ ] Admin reading a message doesn't affect user's notification for their own messages
- [ ] User reading a message doesn't affect admin's notification for their own messages
- [ ] Multiple admins can have independent read status for the same conversation

## Rollback Plan
If issues occur, you can rollback by:
1. Temporarily reverting to use the old `read` column in the queries
2. Change `.eq('read_by_admin', false)` back to `.eq('read', false)` in the code
3. The migration script preserves the old `read` column for backward compatibility

## Performance Notes
- New indexes were added for `read_by_admin` and `read_by_user` columns
- Database queries are optimized to use these indexes
- Real-time subscription performance improved with targeted filtering

## Support
If you encounter issues:
1. Check browser console for error messages
2. Verify database migration completed successfully  
3. Ensure all file changes were applied correctly
4. Test with different user roles and browsers
