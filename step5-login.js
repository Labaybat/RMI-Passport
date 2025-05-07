import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      alert('Login successful! You can now submit your application.');
      loginForm.reset();
    }
  });
}
