@echo off
echo Running SQL script to add sender_name column to messages table...

REM Set up your Supabase credentials
REM Replace these with your actual connection details
SET SUPABASE_DB_URL=your_supabase_db_url
SET SUPABASE_DB_PASSWORD=your_password

REM Run the SQL script
psql "%SUPABASE_DB_URL%" -f "add-sender-name-column.sql"

echo Done! sender_name column added to messages table.
pause
