# Admin Dashboard Migration Guide

## Current Status
The admin dashboard code has been updated to show correct names in the recent activity section, but the database migration needs to be applied to add the required columns.

## Step 1: Apply Database Migration

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `apply-migration.sql`
4. Run the SQL script

### Option B: Using Command Line (If Supabase CLI is set up)
```cmd
cd "c:\Users\Francis\Documents\React Passport Site\Deployed\Debug1\applications tab, admin commenting added"
npx supabase db reset --linked
```

### Option C: Manual SQL Execution
If you have access to your database directly:
```sql
-- Add admin tracking columns
ALTER TABLE public.passport_applications 
ADD COLUMN IF NOT EXISTS last_modified_by_admin_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS last_modified_by_admin_name TEXT;

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_passport_applications_last_modified_by_admin_id 
ON public.passport_applications(last_modified_by_admin_id);
```

## Step 2: Verify Migration Applied
After running the migration, the dashboard should:
1. Stop showing console errors
2. Display "No recent activity" if no applications exist
3. Show proper activity when applications are present

## Step 3: Test the Implementation

### Test Scenario 1: Submit an Application (User Action)
1. Log in as a regular user
2. Submit a passport application
3. Log in as admin
4. Check Dashboard → Should show: "John Doe submitted Application"

### Test Scenario 2: Approve/Reject Application (Admin Action)
1. Log in as admin
2. Go to Applications section
3. Change an application status to "Approved" or "Rejected"
4. Check Dashboard → Should show: "Admin Smith approved Application"

### Test Scenario 3: Edit Application (Admin Action)
1. Log in as admin
2. Edit application details
3. Check Dashboard → Should show: "Admin Smith updated Application"

## Expected Results After Migration

### Recent Activity Display:
- ✅ User submissions: "John Doe submitted Application"
- ✅ Admin approvals: "Admin Smith approved Application"  
- ✅ Admin rejections: "Admin Johnson rejected Application"
- ✅ Admin edits: "Admin Brown updated Application"

### Before Migration (Current State):
- ❌ Console errors about missing columns
- ❌ "No recent activity" even with applications
- ❌ Inconsistent name display

## Troubleshooting

### If you see "No recent activity":
- Create some test applications
- Approve/reject existing applications
- The activity should populate immediately

### If console errors persist:
- Verify migration was applied successfully
- Check browser dev tools for specific error messages
- Refresh the page after migration

### If names still show incorrectly:
- Ensure you're testing with admin actions (approve/reject/edit)
- User actions (submit) should still show user names
- Only admin actions should show admin names
