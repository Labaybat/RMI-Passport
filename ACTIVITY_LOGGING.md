# Admin Activity Logging System

This document describes the admin activity logging system implemented in the application.

## Overview

The admin activity logging system tracks and records all important administrative actions performed in the application. This provides an audit trail for security, accountability, and troubleshooting purposes. The system logs various administrative activities including application status changes, user management actions, comments, and messaging activities.

## Database Structure

The system uses a Supabase table called `admin_activity_log` with the following structure:

| Column       | Type                      | Description                               |
|--------------|---------------------------|-------------------------------------------|
| id           | UUID                      | Primary key                               |
| created_at   | TIMESTAMP WITH TIME ZONE  | When the activity occurred                |
| user_id      | UUID                      | ID of the user who performed the activity |
| user_name    | TEXT                      | Name/email of the user                    |
| action       | TEXT                      | Description of the activity               |
| record_id    | TEXT                      | ID of the affected record (if applicable) |
| ip_address   | TEXT                      | IP address of the user                    |
| device_info  | TEXT                      | User's browser and OS information         |
| details      | JSONB                     | Additional details about the activity     |
| is_admin     | BOOLEAN                   | Whether the user is an admin              |

## Row-Level Security

The table implements Row-Level Security (RLS) with the following policies:

1. **View Policy**: Only admin users can view the activity logs
2. **Insert Policy**: Users can only insert logs for their own activities

## Logged Activities

The system logs the following admin activities:

### Application Management
- Updating application status
- Editing user profiles
- Deleting users
- Adding comments
- Deleting comments

### Messaging
- Sending messages to applicants
- Viewing messages
- Reading messages

### Activity Log
- Viewing the activity log

## Usage

### Logging an Activity

To log an admin activity, use the `logActivityEvent` function:

```typescript*:
import { logActivityEvent } from '../components/ActivityLogComponents';   - By date range (today, yesterday, this week, this month, all time)

// Example: Log when an admin approves an applicationew, status changes, etc.)
await logActivityEvent(
  'Approved Application',  // Action description2. **Activity Feed**:
  applicationId,          // Record ID (optional)y of all logged activities
  {                       // Additional details (optional)   - Color-coded badges for different action types
    applicantName: 'John Doe',ctivity
    previousStatus: 'pending',
    newStatus: 'approved'
  }
);   - Yesterday's activity count
## Logged Activities

The system logs the following administrative actions:

### Application Management
- Viewing applications
- Updating application status
- Reviewing application details

### User Management
- Viewing user profiles
- Editing user profiles
- Deleting users

### Comments
- Adding comments to applications
- Deleting comments from applications

### Messaging
- Viewing messages for an application
- Sending messages to applicants
- Reading messages from applicants

Each logged activity includes relevant context such as application IDs, user information, previous values, and new values when applicable. This provides a complete audit trail for administrative actions.

## Best Practices

- Log all significant administrative actions
- Include relevant context and details
- Don't log sensitive information (passwords, personal data)
- Use consistent action naming conventions
- Viewing application details

### User Management
- Editing user profiles
- Deleting users

### Comments
- Adding comments to applications
- Deleting comments from applications

### Messaging
- Viewing messages for an application
- Sending messages to applicants
- Reading messages from applicants

## Best Practices

- Log all significant administrative actions
- Include relevant context and details
- Don't log sensitive information (passwords, personal data)
- Use consistent action naming conventions
## Implementation Files1. **AdminPage.tsx**: Automatically logs activities like:



















- Use consistent action naming conventions- Don't log sensitive information (passwords, personal data)- Include relevant context and details- Log all significant administrative actions## Best Practices2. Ensure the Admin Dashboard has the Activity Log tab enabled1. Run the SQL migration script: `node supabase/setup-activity-log.js`To set up the activity logging system:## Setup Instructions- **UI Component**: `src/components/ActivityLogComponents.tsx`- **Utility Functions**: `src/lib/admin-logging.ts`- **Database Migration**: `supabase/migrations/20250613_create_admin_activity_log.sql`   - Changing application statuses
   - Editing user profiles
   - Deleting users

2. **ActivityLogComponents.tsx**: 
   - Displays a comprehensive activity log dashboard
   - Allows filtering by date, user type, and action
   - Provides search functionality
   - Shows summary statistics for activity monitoring

3. **admin-logging.ts**:
   - Provides utility functions for admin activity logging
   - Handles device information detection
   - Manages the connection with Supabase storage
```

### Viewing Activity Logs

Admins can view all activity logs in the Admin Dashboard under the "Activity Log" tab. The interface provides filtering, searching, and sorting capabilities.

## Implementation Files

- **Database Migration**: `supabase/migrations/20250613_create_admin_activity_log.sql`
- **Utility Functions**: `src/lib/admin-logging.ts`
- **UI Component**: `src/components/ActivityLogComponents.tsx`

## Setup Instructions

To set up the activity logging system:

1. Run the SQL migration script: `node supabase/setup-activity-log.js`
2. Ensure the Admin Dashboard has the Activity Log tab enabled

## Best Practices

- Log all significant administrative actions
- Include relevant context and details
- Don't log sensitive information (passwords, personal data)
- Use consistent action naming conventions
