import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0'

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Parse the request body
    const { user_id } = await req.json()
    
    // Validate input
    if (!user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'user_id is required' 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }, 
          status: 400 
        }
      )
    }

    console.log(`Attempting to delete user: ${user_id}`)

    // Create a Supabase client with the service role key
    // IMPORTANT: This key has admin privileges and can bypass RLS
    // It should NEVER be exposed to the client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Optional: Remove files from storage
    // Comment out this block if not needed
    try {
      console.log('Attempting to delete user files from storage')
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from('passport-documents')
        .list(user_id)
      
      if (storageError) {
        console.error('Error listing user files:', storageError)
      } else if (storageFiles && storageFiles.length > 0) {
        const filesToDelete = storageFiles.map(file => `${user_id}/${file.name}`)
        const { error: deleteError } = await supabase
          .storage
          .from('passport-documents')
          .remove(filesToDelete)
          
        if (deleteError) {
          console.error('Error deleting user files:', deleteError)
        } else {
          console.log(`Successfully deleted ${filesToDelete.length} files for user ${user_id}`)
        }
      }
    } catch (storageErr) {
      // Don't block the user deletion if file cleanup fails
      console.error('Error during file cleanup:', storageErr)
    }

    // Delete the user using the Admin API
    console.log('Calling auth.admin.deleteUser')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id)
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: deleteError.message 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }, 
          status: 500 
        }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User successfully deleted with all associated data' 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Unexpected error in delete-user function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server error: ${error.message}` 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }, 
        status: 500 
      }
    )
  }
})
