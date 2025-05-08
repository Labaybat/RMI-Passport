
import { supabase } from './supabase.js';

// Redirect to dashboard if already logged in
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    window.location.href = "dashboard.html";
  }
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    window.location.href = 'dashboard.html';
  } else {
    alert('Login failed: ' + error.message);
  }
});

document.getElementById('signup-link')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = prompt("Enter your email to sign up:");
  const password = prompt("Create a password:");
  const { error } = await supabase.auth.signUp({ email, password });
  if (!error) {
    alert("Signup successful! Please log in.");
  } else {
    alert("Signup failed: " + error.message);
  }
});
