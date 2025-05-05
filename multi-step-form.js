import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient('https://injquzndhzqcamtenbum.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluanF1em5kaHpxY2FtdGVuYnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODg1NTEsImV4cCI6MjA2MTk2NDU1MX0.pZnLipghLKXmWISsTUYK3WQl0cr_kJr39Ly571a3yew');

document.getElementById('passport-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('first-name').value;
  const lastName = document.getElementById('last-name').value;
  const dob = document.getElementById('dob').value;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    alert('You must be logged in to submit the form.');
    return;
  }

  const user_id = userData.user.id;

  const { error } = await supabase.from('passport_applications').insert([{
    user_id,
    first_name: firstName,
    last_name: lastName,
    dob
  }]);

  if (error) {
    alert('Failed to submit application: ' + error.message);
  } else {
    alert('Application submitted successfully!');
    window.location.href = 'dashboard.html';
  }
});
