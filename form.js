
import { supabase } from './supabase.js';

let currentStep = 1;
let userId = null;
let applicationId = null;

async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (data?.user?.id) {
    userId = data.user.id;
    console.log("User ID:", userId);

    const { data: existing } = await supabase
      .from('passport_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .limit(1)
      .maybeSingle();

    if (existing) {
      applicationId = existing.id;
      console.log("Loaded draft application ID:", applicationId);
    }
  } else {
    window.location.href = 'index.html';
  }
}

document.addEventListener('DOMContentLoaded', getUser);
