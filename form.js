
import { supabase } from './supabase.js';

let currentStep = 1;
let userId = null;
let applicationId = null;

async function getUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    alert("Failed to fetch user session.");
    window.location.href = 'index.html';
    return null;
  }
  return data.session.user;
}

// Further logic should follow using the shared supabase client
