# Supabase Column Addition Guide

This guide explains how to add the `sender_name` column to your Supabase messages table to fix the error:
`Could not find the 'sender_name' column of 'messages' in the schema cache`

## Option 1: Using the Supabase Dashboard

1. Log into your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the "Table Editor" section
4. Find the "messages" table
5. Click on "Edit table"
6. Add a new column with the following settings:
   - Name: `sender_name`
   - Type: `text`
   - Default Value: `null` (leave blank)
   - Is Nullable: `true` (checked)
   - Is Primary: `false` (unchecked)
   - Is Unique: `false` (unchecked)
7. Click "Save" to apply the changes

## Option 2: Using SQL Editor

1. Log into your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Paste the following SQL:
   ```sql
   -- Add sender_name column to messages table
   ALTER TABLE messages 
   ADD COLUMN sender_name TEXT;

   -- Update the schema cache to prevent PGRST204 errors
   NOTIFY pgrst, 'reload schema';
   ```
6. Click "Run" to execute the query

## Option 3: Using the Database CLI

If you have database access configured, edit the connection details in the `apply-sender-name-column.bat` file, then run it.

## Confirming the Change

After applying the change:

1. Go to the Table Editor in Supabase
2. Check the "messages" table
3. Verify the "sender_name" column exists
4. Restart your application and verify that admins can now send messages without errors

## Troubleshooting

If you still encounter errors after adding the column:

1. Refresh the Supabase API cache by running:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
2. Restart your application completely
3. Clear any client-side caches
