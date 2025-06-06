@echo off
echo ======================================================
echo Supabase Edge Function Deployment Helper
echo ======================================================
echo.
echo This script will help you deploy the delete-user Edge Function
echo to your Supabase project and set up the required secrets.
echo.

echo Checking if Supabase CLI is installed...
supabase --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Supabase CLI is not installed. Please install it first:
  echo npm install -g supabase
  goto :EOF
)

echo Supabase CLI is installed.
echo.

echo Step 1: Log in to Supabase (if not already logged in)
echo.
supabase login

echo.
echo Step 2: Enter your Supabase project reference ID
echo You can find this in your project URL: https://app.supabase.com/project/YOUR_PROJECT_REF
echo.
set /p PROJECT_REF="Enter your Supabase project reference ID: "

echo.
echo Step 3: Deploying the delete-user function...
echo.
supabase functions deploy delete-user --project-ref %PROJECT_REF%

echo.
echo Step 4: Set required secrets for the function
echo.
echo Please enter your Supabase URL (https://YOUR_PROJECT_REF.supabase.co):
set /p SUPABASE_URL="Supabase URL: "

echo.
echo Please enter your Supabase service_role key (from Project Settings > API):
echo WARNING: This key has admin privileges. Never expose it in client-side code!
echo.
set /p SERVICE_ROLE_KEY="Service Role Key: "

echo.
echo Setting up secrets...
supabase secrets set SUPABASE_URL=%SUPABASE_URL% --project-ref %PROJECT_REF%
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=%SERVICE_ROLE_KEY% --project-ref %PROJECT_REF%

echo.
echo Step 5: Set CORS configuration to allow requests from your domain
echo.
echo By default, we'll allow requests from all origins (*).
echo For production, you should restrict this to your specific domain.
echo.
set /p ALLOW_ORIGIN="Enter your domain (or press Enter for *): "

if "%ALLOW_ORIGIN%"=="" (
  set ALLOW_ORIGIN=*
)

supabase functions update-cors delete-user --allowed-origins="%ALLOW_ORIGIN%" --project-ref %PROJECT_REF%

echo.
echo ======================================================
echo Deployment completed!
echo ======================================================
echo.
echo You can now call the function from your frontend code using:
echo.
echo const { data, error } = await supabase.functions.invoke('delete-user', {
echo   body: { user_id: 'USER_ID_TO_DELETE' }
echo });
echo.
echo Remember: This function uses the service_role key and should be
echo called only from trusted contexts (e.g., admin panel).
echo ======================================================

pause
