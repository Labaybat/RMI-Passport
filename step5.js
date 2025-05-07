import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = 'https://svkusntallxdxrsgdqzt.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a3VzbnRhbGx4ZHhyc2dkcXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTE3NjMsImV4cCI6MjA2MjA2Nzc2M30.-vsOMTTOo8cX5ejbIjwoEGskFx_FZ-yYqVX4EbSDPGQ';
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  const form = document.getElementById("final-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData?.user) {
      alert("You must be logged in.");
      window.location.href = "login.html";
      return;
    }

    const fileInput = document.getElementById("signature");
    const file = fileInput.files[0];
    const fileName = `${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("signatures")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      alert("Upload error: " + uploadError.message);
      return;
    }

    const dobInput = document.getElementById("dob").value;
    let normalizedDOB = null;
    try {
      normalizedDOB = new Date(dobInput).toISOString();
    } catch (_) {
      alert("Invalid date format for DOB.");
      return;
    }

    const { error: insertError } = await supabaseClient
      .from("passport_applications")
      .insert([{
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        dob: normalizedDOB,
        passport_type: document.getElementById("passport_type").value,
        ssn: document.getElementById("ssn").value,
        email: document.getElementById("email").value,
        occupation: document.getElementById("occupation").value,
        signature: fileName
      }]);

    if (insertError) {
      alert("Submit error: " + insertError.message);
    } else {
      alert("Application submitted successfully!");
      window.location.href = "confirmation.html";
    }
  });
});
