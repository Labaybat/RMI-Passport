// Test script for activity logging functionality
import supabase from './src/lib/supabase/client';
import { logAdminActivity } from './src/lib/admin-logging';

// Insert a test activity log entry
const testActivityLogging = async () => {
  try {
    console.log('Starting activity logging test...');
    
    // Get current user for testing
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      console.log('Please sign in to test the activity logging.');
      return;
    }
    
    // Log a test activity
    const result = await logAdminActivity({
      userId: user.id,
      userName: user.email || 'Test User',
      action: 'Test Activity Log Entry',
      recordId: 'test-record-id',
      details: { test: true, timestamp: new Date().toISOString() },
      isAdmin: true,
      deviceInfo: 'Test Script / NodeJS'
    });
    
    console.log('Activity log result:', result);
    
    // Query the activity log table to verify
    const { data: logs, error: logsError } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
      return;
    }
    
    console.log('Recent activity logs:', logs);
    console.log('Activity logging test completed successfully!');
    
  } catch (error) {
    console.error('Error in activity logging test:', error);
  }
};

// Run the test
testActivityLogging();
