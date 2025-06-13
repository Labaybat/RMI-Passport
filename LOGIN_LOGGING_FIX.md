# Admin/Staff Login Activity Logging Fix

## Issue Description
Admin and staff login activities were not being recorded in the activity log, preventing proper audit trails of administrative access to the system.

## Root Cause
The `logActivityEvent()` function was not being called after successful authentication in the `LoginPage.tsx` component for admin and staff users. Similarly, logout events were not being captured in the `AdminPage.tsx` component.

## Solution Implemented

### Login Activity Logging
Modified the `LoginPage.tsx` component to:
1. Import the `logActivityEvent` function
2. After successful authentication and profile fetching, check if the user has admin or staff role
3. If admin/staff, call the `logActivityEvent` function to record the login activity with appropriate details

### Logout Activity Logging
Enhanced the `handleLogout` function in `AdminPage.tsx` to:
1. Log the logout activity before performing the actual sign-out
2. Include user role information as part of the activity details

## Verification
A test script (`test-login-logging.js`) has been created to verify that admin and staff login activities are now being properly recorded. This script checks for login and logout events in the `admin_activity_log` table from the past 24 hours.

To run the test:
1. Ensure you have the proper environment variables set up in a `.env` file
2. Run the `verify-login-logging.bat` script
3. Check the console output for results

## Implementation Details

### LoginPage.tsx Changes
- Imported the `logActivityEvent` function
- Added code to log successful admin/staff logins with their role information
- Added detailed login information (method, role) to the activity log

### AdminPage.tsx Changes
- Enhanced the `handleLogout` function to log the logout activity with role information
- Ensured the logout event is logged before the actual sign-out process to maintain user context

## Security Benefits
- Complete audit trail of administrative access to the system
- Ability to detect suspicious login patterns
- Improved compliance with security best practices for administrative systems
