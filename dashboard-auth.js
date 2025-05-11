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

// Global logout function for mobile browsers that rely on inline onclick
window.logout = async function () {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
};
