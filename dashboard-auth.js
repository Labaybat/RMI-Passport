
import { supabase } from './supabase.js';

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (!session) {
    // User logged out
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
