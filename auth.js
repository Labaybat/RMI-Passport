
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://injquzndhzqcamtenbum.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluanF1em5kaHpxY2FtdGVuYnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODg1NTEsImV4cCI6MjA2MTk2NDU1MX0.pZnLipghLKXmWISsTUYK3WQl0cr_kJr39Ly571a3yew'
);

let currentUserId = null;

const sessionData = await supabase.auth.getSession();
if (!sessionData.data.session) {
  window.location.href = "login.html";
} else {
  currentUserId = sessionData.data.session.user.id;
}

// Example autosave logic for a form
const nextBtn = document.getElementById("nextBtn");
if (nextBtn) {
  nextBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const formElements = document.querySelectorAll("form input, form select, form textarea");
    const formData = { user_id: currentUserId };

    formElements.forEach((el) => {
      if (el.name) formData[el.name] = el.value;
    });

    const { error } = await supabase
      .from("passport_applications")
      .upsert([formData], { onConflict: ['user_id'] });

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      console.log("Application saved.");
    }
  });
}
