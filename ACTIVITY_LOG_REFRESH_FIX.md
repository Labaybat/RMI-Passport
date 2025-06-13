# Activity Log Refresh Fix

## Issue
Users were seeing different numbers of "Viewed Activity Log" entries in the activity log. Specifically:

- Francis (with auto-refresh enabled) had many "Viewed Activity Log" entries
- Faith (without auto-refresh) had very few or no "Viewed Activity Log" entries

## Root Cause
When the Activity Log component was accessed, it would log a "Viewed Activity Log" entry for each refresh:

1. **Initial page load** - This correctly logged a "Viewed Activity Log" entry for all users
2. **Manual refresh** - When clicking the refresh button, this correctly logged another entry
3. **Auto-refresh** - The auto-refresh feature was not logging "Viewed Activity Log" entries, creating inconsistency

## Solution
Modified the activity log component to:

1. Add a `silent` parameter to the `fetchActivityData()` function
2. Only log "Viewed Activity Log" entries when it's not a silent/auto-refresh call
3. Use the silent mode parameter for auto-refresh calls
4. Update the auto-refresh effect to call `fetchActivityData(true)` with the silent flag

This change ensures consistent behavior across users regardless of whether they have auto-refresh enabled or not. It also improves the activity log by not filling it with automatic refresh entries, focusing instead on intentional views of the log.

## Files Modified
- `src/components/ActivityLogComponents.tsx`

## Testing
To verify this fix:
1. Log in as an administrator
2. Visit the Activity Log page
3. Confirm a "Viewed Activity Log" entry is created
4. Toggle auto-refresh on and wait for 30+ seconds
5. Verify no additional "Viewed Activity Log" entries are created during auto-refresh
6. Click the manual refresh button
7. Verify another "Viewed Activity Log" entry is created

## Implementation Details
- Added `silent` parameter to `fetchActivityData()` function
- Modified activity logging to check for silent mode before logging view events
- Updated auto-refresh effect to use silent mode
- Improved loading state and error handling to respect silent mode
