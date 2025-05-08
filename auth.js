import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabase = createClient('https://eiuviyizjnfmswfrdigo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXZpeWl6am5mbXN3ZnJkaWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Nzc1MDIsImV4cCI6MjA2MjI1MzUwMn0.M1E6xOKAc8fsiVkXAxorr1QCRqRedcDv-GNa9CuAE4M');

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) window.location.href = 'dashboard.html';
  else alert('Login failed');
});

document.getElementById('signup-link')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = prompt("Email:");
  const password = prompt("Password:");
  const { error } = await supabase.auth.signUp({ email, password });
  if (!error) alert("Check your email to confirm.");
});

document.getElementById('logout')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});
