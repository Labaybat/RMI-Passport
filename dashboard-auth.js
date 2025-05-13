
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      window.location.href = 'index.html';
    }
  });

  // Protect the page if not logged in initially
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      window.location.href = 'index.html';
    }
  });

  // Logout handler
  document.querySelector('.logout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
  });
});
