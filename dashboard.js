import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient('https://injquzndhzqcamtenbum.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluanF1em5kaHpxY2FtdGVuYnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODg1NTEsImV4cCI6MjA2MTk2NDU1MX0.pZnLipghLKXmWISsTUYK3WQl0cr_kJr39Ly571a3yew');

// Get current user
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

document.getElementById('user-info').innerHTML = `<strong>Logged in as:</strong> ${user.email}`;

const { data, error } = await supabase
  .from('passport_applications')
  .select('*')
  .eq('user_id', user.id);

const infoDiv = document.getElementById('application-info');
const noAppMsg = document.getElementById('no-application');

if (error) {
  infoDiv.innerHTML = `<p style='color:red;'>Error loading applications: ${error.message}</p>`;
} else if (data.length === 0) {
  noAppMsg.style.display = 'block';
} else {
  const app = data[0];
  infoDiv.innerHTML = `
    <h3>Application Info</h3>
    <p><strong>First Name:</strong> ${app.first_name}</p>
    <p><strong>Last Name:</strong> ${app.last_name}</p>
    <p><strong>Date of Birth:</strong> ${app.dob}</p>
    <p><strong>Submitted:</strong> ${new Date(app.created_at).toLocaleString()}</p>
  `;
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});
