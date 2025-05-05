
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://injquzndhzqcamtenbum.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluanF1em5kaHpxY2FtdGVuYnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODg1NTEsImV4cCI6MjA2MTk2NDU1MX0.pZnLipghLKXmWISsTUYK3WQl0cr_kJr39Ly571a3yew'
);

window.addEventListener('DOMContentLoaded', async () => {
  const { data: sessionData, error } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    alert("You're not logged in. Redirecting...");
    window.location.href = "/login.html";
    return;
  }

  const nextBtn = document.getElementById("nextBtn");
  if (!nextBtn) return;

  nextBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const inputs = document.querySelectorAll("form input, form select, form textarea");
    const formData = { user_id: user.id };

    inputs.forEach(input => {
      if (input.name) {
        formData[input.name] = input.value;
      }
    });

    const { error } = await supabase
      .from("passport_applications")
      .upsert([formData], { onConflict: ['user_id'] });

    if (error) {
      console.error("Error saving:", error.message);
      alert("Save failed: " + error.message);
    } else {
      console.log("Application saved successfully.");
    }
  });
});
