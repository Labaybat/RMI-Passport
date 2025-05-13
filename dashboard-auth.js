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


document.addEventListener('DOMContentLoaded', () => {
  let hideMenuTimer;
  const menu = document.getElementById('avatarMenu');
  const avatar = document.querySelector('.dashboard-avatar-hover');

  function showMenu() {
    if (!menu) return;
    clearTimeout(hideMenuTimer);
    menu.classList.add('show');
  }

  function startHideTimer() {
    if (!menu) return;
    hideMenuTimer = setTimeout(() => {
      menu.classList.remove('show');
    }, 3000);
  }

  function toggleMenu(e) {
    if (!menu) return;
    e.stopPropagation();
    showMenu();
    setTimeout(() => {
      menu.classList.remove('show');
    }, 3000);
  }

  if (avatar) {
    avatar.addEventListener('mouseenter', showMenu);
    avatar.addEventListener('mouseleave', startHideTimer);
    avatar.addEventListener('touchstart', toggleMenu);
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dashboard-avatar-hover')) {
      menu?.classList.remove('show');
    }
  });
});
