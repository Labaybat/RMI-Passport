# User Deletion Edge Function

This document explains how to deploy and use the Supabase Edge Function for securely deleting users from your application.

## Overview

The `delete-user` Edge Function provides a secure way to delete users from your application using Supabase's Admin API. It's designed to be called from admin panels or other trusted contexts, as it uses the `service_role` key which has elevated privileges.

## Features

- Securely deletes users using the Admin API
- Automatically cascades deletion to related records via database foreign key constraints
- Optionally removes user files from storage
- Handles CORS for cross-origin requests
- Returns detailed success or error information

## Deployment

### Option 1: Using the Deployment Script

The easiest way to deploy is to use the provided batch script:

1. Open Command Prompt
2. Navigate to your project directory
3. Run `deploy-delete-user-function.bat`
4. Follow the prompts to enter your Supabase project details and API keys

### Option 2: Manual Deployment

If you prefer to deploy manually:

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Log in to Supabase:
   ```bash
   supabase login
   ```

3. Deploy the function:
   ```bash
   supabase functions deploy delete-user --project-ref YOUR_PROJECT_REF
   ```

4. Set the required secrets:
   ```bash
   supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co --project-ref YOUR_PROJECT_REF
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY --project-ref YOUR_PROJECT_REF
   ```

5. Configure CORS if needed:
   ```bash
   supabase functions update-cors delete-user --allowed-origins="https://your-site.com" --project-ref YOUR_PROJECT_REF
   ```

## Database Setup

For cascade deletion to work properly, your database must have foreign key constraints with `ON DELETE CASCADE` set up. Run the `setup-cascade-delete.sql` script in your Supabase SQL editor to configure this.

## Usage

### From Frontend Code

```typescript
async function deleteUser(userId) {
  try {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId }
    });
    
    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Failed to call delete-user function:', err);
    return { success: false, error: err };
  }
}
```

### Response Format

Success Response:
```json
{
  "success": true,
  "message": "User successfully deleted with all associated data"
}
```

Error Response:
```json
{
  "success": false,
  "error": "Error message details"
}
```

## Security Considerations

- This function uses the `service_role` key which has admin privileges. Never expose this key in client-side code.
- Only allow trusted admins to call this function.
- Consider adding additional authorization checks within the function (e.g., verify the caller is an admin).
- For production, restrict CORS to only your application domains.

## Troubleshooting

If you encounter issues:

1. Check the function logs in the Supabase dashboard
2. Ensure your secrets are correctly set
3. Verify that CORS is properly configured
4. Test the function directly using the Supabase dashboard or cURL

## Customization

You can modify the function to add additional features:

- Add more sophisticated authorization checks
- Handle deletion of additional related data
- Add logging or notifications when users are deleted
- Implement soft delete instead of hard delete
