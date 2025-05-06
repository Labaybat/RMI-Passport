
document.addEventListener("DOMContentLoaded", () => {
  const { createClient } = supabase;
  const supabaseUrl = "https://svkusntallxdxrsgdqzt.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a3VzbnRhbGx4ZHhyc2dkcXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTE3NjMsImV4cCI6MjA2MjA2Nzc2M30.-vsOMTTOo8cX5ejbIjwoEGskFx_FZ-yYqVX4EbSDPGQ";
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  const form = document.getElementById("final-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("signature");
    const file = fileInput.files[0];

    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabaseClient.storage
      .from("signatures")
      .upload(fileName, file);

    if (uploadError) {
      alert("Upload error: " + uploadError.message);
      return;
    }

    const { error: insertError } = await supabaseClient
      .from("passport_applications")
      .insert([{
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        dob: document.getElementById("dob").value,
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
