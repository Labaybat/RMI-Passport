@echo off
echo ======================================================
echo Fix Admin Reference Foreign Key Constraint
echo ======================================================
echo.
echo This script will fix the foreign key constraint issue
echo with the last_modified_by_admin_id field.
echo.

echo Please enter your Supabase project details:
set /p PROJECT_ID=Project ID: 
set /p DB_PASSWORD=Database Password: 

echo.
echo Running SQL script to fix the constraint...
echo.

psql "postgresql://postgres:%DB_PASSWORD%@db.%PROJECT_ID%.supabase.co:5432/postgres" -f fix-admin-reference.sql

echo.
echo Constraint fix completed!
echo You should now be able to delete admin users who have modified applications.
echo.
pause
