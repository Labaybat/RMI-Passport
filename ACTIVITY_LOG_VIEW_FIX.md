# Activity Log View Fix

## Issue
The activity log was recording every time an admin or staff member viewed the activity log or clicked the refresh button. This resulted in excessive "Viewed Activity Log" entries in the activity log itself, cluttering the log with information that wasn't important.

## Solution
Removed the code that logs "Viewed Activity Log" entries while keeping all other activity logging intact:

1. Removed the entire code block that logged activity when viewing the activity log or refreshing it
2. Updated JSDoc comments to reflect that the function no longer logs activity
3. Updated comments in the auto-refresh functionality to remove mentions of activity logging

## Files Modified
- `src/components/ActivityLogComponents.tsx`

## Benefits
1. **Cleaner Activity Log**: The activity log now focuses on meaningful administrative actions rather than being cluttered with view events.
2. **Reduced Database Writes**: Fewer log entries means less database writes, which can improve performance.
3. **More Relevant Activity Tracking**: The log now only records substantive actions like application processing, user management, etc.

## Testing
To verify this fix:
1. Log in as an administrator
2. Visit the Activity Log page
3. Confirm that no "Viewed Activity Log" entry is created
4. Click the refresh button 
5. Verify no "Viewed Activity Log" entries appear in the log
6. Toggle auto-refresh on and wait 
7. Verify no logging occurs during auto-refresh

## Technical Implementation Details
Removed code that:
- Got the current user information 
- Fetched the user's profile
- Created the log entry with "Viewed Activity Log" action

This change maintains all other functionality including:
- Loading state management
- Data fetching
- Filtering
- Auto-refresh capabilities
