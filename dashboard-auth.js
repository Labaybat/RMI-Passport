
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  // Protect page access
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      window.location.href = 'index.html';
    }
  });

  // Listen for logout events
  document.querySelector('.logout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    // Redirect will happen after session change below
  });

  // Session change redirect
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      window.location.href = 'index.html';
    }
  });
});
