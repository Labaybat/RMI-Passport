import { supabase } from './supabase.js';

// Protect page access
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    window.location.href = 'index.html';
  }
});

// Logout function
document.querySelector('.logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});

supabase.auth.getUser().then(({ data: { user } }) => {
  if (user) {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Guest";
    document.getElementById("user-name").textContent = name;
  }
});
