// Example integration with AdminPage.tsx

// Import necessary dependencies
import { useState } from 'react';
import { supabase } from '../lib/supabase/client'; // Adjust import path as needed
import { toast } from 'some-toast-library'; // Adjust based on your toast implementation

// Example delete user function that uses the Edge Function
const handleDeleteUser = async (user: any) => {
  // Show confirmation dialog
  const confirmMessage = `Are you sure you want to delete user "${user.first_name} ${user.last_name}"? This action cannot be undone and will remove all their data including passport applications.`;
  if (!window.confirm(confirmMessage)) {
    return;
  }

  // Set loading state if needed
  setDeletingUserId(user.id);

  try {
    console.log(`Attempting to delete user: ${user.id}`);
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: user.id }
    });

    // Handle response
    if (error) {
      console.error('Error calling delete-user function:', error);
      throw new Error(error.message || 'Failed to delete user');
    }

    if (!data.success) {
      console.error('Function reported error:', data.error);
      throw new Error(data.error || 'Function failed to delete user');
    }

    // Success! Function deleted the user properly
    console.log('User deletion successful:', data);
    toast({
      title: "Success",
      description: "User and all associated data deleted successfully!"
    });

    // Update UI state
    setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));

    // Close any open modals if needed
    if (selectedUser && selectedUser.id === user.id) {
      setShowViewUserModal(false);
      setShowEditUserModal(false);
      setSelectedUser(null);
    }
    
  } catch (err: any) {
    // Handle errors
    console.error("Error deleting user:", err);
    toast({
      title: "Error",
      description: err.message || "Failed to delete user."
    });
  } finally {
    // Clean up loading state
    setDeletingUserId(null);
  }
};

// Example fallback implementation if Edge Function fails
// This can be used as a backup strategy
const handleDeleteUserFallback = async (user: any) => {
  // Show confirmation dialog
  const confirmMessage = `Are you sure you want to delete user "${user.first_name} ${user.last_name}"? This action cannot be undone and will remove all their data including passport applications.`;
  if (!window.confirm(confirmMessage)) {
    return;
  }

  setDeletingUserId(user.id);

  try {
    // Try with Edge Function first
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'delete-user',
        {
          body: { user_id: user.id }
        }
      );

      if (!functionError && functionData?.success) {
        // Edge function succeeded!
        toast({
          title: "Success",
          description: "User and all associated data deleted successfully!"
        });
        
        // Update UI and return
        setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
        return;
      }
      
      // If we get here, the edge function failed, continue to fallback
      console.warn("Edge function failed, falling back to direct deletion:", functionError || functionData?.error);
    } catch (edgeFunctionError) {
      console.warn("Edge function error, falling back to direct deletion:", edgeFunctionError);
    }
    
    // FALLBACK APPROACH: Direct database deletion (requires cascade deletes)
    
    // Delete related data first
    const { error: appsError } = await supabase
      .from("passport_applications")
      .delete()
      .eq("user_id", user.id);

    if (appsError) {
      console.warn("Error deleting user's passport applications:", appsError);
    }

    // Delete user from profiles table
    // This will cascade to auth.users if you've set up the foreign key constraints
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    toast({
      title: "Success",
      description: "User deleted successfully!"
    });

    // Update UI state
    setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));

  } catch (err: any) {
    console.error("Error deleting user:", err);
    toast({
      title: "Error",
      description: err.message || "Failed to delete user."
    });
  } finally {
    setDeletingUserId(null);
  }
};
