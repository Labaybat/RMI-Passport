import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://svkusntallxdxrsgdqzt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a3VzbnRhbGx4ZHhyc2dkcXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTE3NjMsImV4cCI6MjA2MjA2Nzc2M30.-vsOMTTOo8cX5ejbIjwoEGskFx_FZ-yYqVX4EbSDPGQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// REGISTER
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const password = form.password.value;
  const full_name = form.full_name.value;
  const dob = form.dob.value;
  const phone = form.phone.value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        dob,
        phone
      }
    }
  });

  if (error) {
    alert("Registration Error: " + error.message);
  } else {
    alert("Account created. Please check your email to confirm.");
    window.location.href = 'login.html';
  }
});

// LOGIN
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login failed: " + error.message);
  } else {
    window.location.href = 'dashboard.html';
  }
});
