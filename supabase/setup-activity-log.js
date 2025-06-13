// Script to set up the admin activity log table in Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This requires the service key, not anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key');
  console.log('Please ensure you have the following environment variables set:');
  console.log('- VITE_SUPABASE_URL: Your Supabase project URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (from Project Settings > API)');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupActivityLog() {
  try {
    console.log('Setting up admin activity log table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', '20250613_create_admin_activity_log.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements (simplistic approach - might need improvement for complex SQL)
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('Error executing SQL:', error);
        }
      }
    }
    
    console.log('Admin activity log table setup complete!');
    
    // Insert a test record to verify it's working
    const { data, error } = await supabase.from('admin_activity_log').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
      user_name: 'System',
      action: 'Setup Activity Log',
      details: { automated: true },
      is_admin: true
    });
    
    if (error) {
      console.error('Error inserting test record:', error);
    } else {
      console.log('Test record inserted successfully!');
    }
    
  } catch (error) {
    console.error('Error setting up admin activity log:', error);
  }
}

setupActivityLog();
