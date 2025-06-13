// Script to verify the activity log table and display recent activity
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service key to bypass RLS

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key');
  console.log('Please ensure you have the following environment variables set:');
  console.log('- VITE_SUPABASE_URL: Your Supabase project URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (from Project Settings > API)');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyActivityLog() {
  try {
    console.log('Verifying admin activity log data...\n');
    
    // Check if the table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('admin_activity_log')
      .select('count(*)', { count: 'exact' });
    
    if (tableError) {
      console.error('Error checking admin_activity_log table:', tableError);
      console.log('The activity log table may not exist or there might be permission issues.');
      return;
    }
    
    // Get recent activity logs
    const { data: logs, error: logsError } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
      return;
    }
    
    if (!logs || logs.length === 0) {
      console.log('No activity logs found in the database.');
      console.log('The table exists but contains no data.');
      
      // Insert a test record
      console.log('\nInserting a test record to verify table functionality...');
      const { data: insertData, error: insertError } = await supabase
        .from('admin_activity_log')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          user_name: 'Verification Script',
          action: 'Verify Activity Log',
          record_id: 'verification-test',
          details: { 
            automated: true, 
            timestamp: new Date().toISOString(),
            purpose: 'Verifying activity log table functionality'
          },
          is_admin: true
        })
        .select();
      
      if (insertError) {
        console.error('Error inserting test record:', insertError);
      } else {
        console.log('Test record inserted successfully!');
      }
    } else {
      // Display logs in a formatted way
      console.log(`Found ${logs.length} activity log entries. Recent activities:\n`);
      
      logs.forEach((log, index) => {
        const date = new Date(log.created_at).toLocaleString();
        const details = log.details ? 
          (typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)) : 
          'No details';
          
        console.log(`[${index + 1}] ${date} - ${log.user_name} (${log.is_admin ? 'Admin' : 'Staff'})`);
        console.log(`    Action: ${log.action}`);
        if (log.record_id) console.log(`    Record ID: ${log.record_id}`);
        console.log(`    Details: ${details}`);
        if (log.ip_address) console.log(`    IP: ${log.ip_address}`);
        if (log.device_info) console.log(`    Device: ${log.device_info}`);
        console.log(''); // Empty line for separation
      });
      
      // Count activities by type
      const actionCounts = {};
      logs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });
      
      console.log('Activity types:');
      Object.entries(actionCounts).forEach(([action, count]) => {
        console.log(`    ${action}: ${count}`);
      });
    }
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

verifyActivityLog();
