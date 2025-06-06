// Debug script to check database structure and data
// Run this with: node debug-database.js

import { createClient } from '@supabase/supabase-js'

// You'll need to add your actual Supabase URL and anon key here
const supabaseUrl = 'https://eiuviyizjnfmswfrdigo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXZpeWl6am5mbXN3ZnJkaWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Nzc1MDIsImV4cCI6MjA2MjI1MzUwMn0.M1E6xOKAc8fsiVkXAxorr1QCRqRedcDv-GNa9CuAE4MY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('=== DEBUG: Checking Database Structure ===')
  
  try {
    // 1. Check passport_applications table structure
    console.log('\n1. Fetching sample passport_applications...')
    const { data: apps, error: appsError } = await supabase
      .from('passport_applications')
      .select('*')
      .limit(2)
    
    if (appsError) {
      console.log('Error fetching applications:', appsError)
    } else {
      console.log('Sample applications:', apps)
      if (apps && apps.length > 0) {
        console.log('First application user_id:', apps[0].user_id)
        console.log('Application columns:', Object.keys(apps[0]))
      }
    }
    
    // 2. Check profiles table structure
    console.log('\n2. Fetching sample profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(2)
    
    if (profilesError) {
      console.log('Error fetching profiles:', profilesError)
    } else {
      console.log('Sample profiles:', profiles)
      if (profiles && profiles.length > 0) {
        console.log('First profile id:', profiles[0].id)
        console.log('Profile columns:', Object.keys(profiles[0]))
      }
    }
    
    // 3. Try to find matching user_ids
    if (apps && apps.length > 0 && profiles && profiles.length > 0) {
      console.log('\n3. Checking for matching user_ids...')
      const appUserIds = apps.map(app => app.user_id).filter(Boolean)
      const profileIds = profiles.map(profile => profile.id).filter(Boolean)
      
      console.log('Application user_ids:', appUserIds)
      console.log('Profile ids:', profileIds)
      
      const matches = appUserIds.filter(userId => profileIds.includes(userId))
      console.log('Matching IDs:', matches)
    }
    
    // 4. Test manual join approach
    console.log('\n4. Testing manual join approach...')
    const { data: testApps, error: testError } = await supabase
      .from('passport_applications')
      .select('user_id, surname, first_middle_names, status, created_at')
      .limit(5)
    
    if (testError) {
      console.log('Error in test query:', testError)
      return
    }
    
    if (testApps && testApps.length > 0) {
      const userIds = [...new Set(testApps.map(app => app.user_id).filter(Boolean))]
      console.log('Unique user_ids from apps:', userIds)
      
      const { data: testProfiles, error: profilesTestError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds)
      
      if (profilesTestError) {
        console.log('Error fetching profiles for user_ids:', profilesTestError)
      } else {
        console.log('Profiles found for these user_ids:', testProfiles)
        
        // Create mapping
        const profilesMap = new Map()
        testProfiles?.forEach(profile => {
          profilesMap.set(profile.id, profile)
        })
        
        console.log('\nMerged results:')
        testApps.forEach(app => {
          const profile = profilesMap.get(app.user_id)
          console.log(`App: ${app.surname} ${app.first_middle_names} (user_id: ${app.user_id}) -> Profile: ${profile ? `${profile.first_name} ${profile.last_name}` : 'NOT FOUND'}`)
        })
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugDatabase()
