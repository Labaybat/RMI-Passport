
// Include Supabase via CDN (see index.html or apply.html)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient('https://injquzndhzqcamtenbum.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluanF1em5kaHpxY2FtdGVuYnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODg1NTEsImV4cCI6MjA2MTk2NDU1MX0.pZnLipghLKXmWISsTUYK3WQl0cr_kJr39Ly571a3yew');
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

    nextBtn.addEventListener("click", async () => {
        const form = document.getElementById("passportForm");
        if (!form) return;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.user_id = user.id;
        data.updated_at = new Date().toISOString();
        await supabase.from("passport_applications").upsert(data, { onConflict: ["user_id"] });
        alert("Progress saved.");
    });
});