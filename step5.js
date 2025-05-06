
const form = document.getElementById("finalForm");
const status = document.getElementById("status");

const supabaseUrl = "https://svkusntallxdxrsgdqzt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a3VzbnRhbGx4ZHhyc2dkcXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTE3NjMsImV4cCI6MjA2MjA2Nzc2M30.-vsOMTTOo8cX5ejbIjwoEGskFx_FZ-yYqVX4EbSDPGQ";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  const file = formData.get("signature");
  const fileName = `sig_${Date.now()}_${file.name}`;

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("signatures")
    .upload(fileName, file);

  if (uploadError) {
    status.textContent = "Error uploading file: " + uploadError.message;
    return;
  }

  const fileUrl = `${supabaseUrl}/storage/v1/object/public/signatures/${fileName}`;

  // Save user application data to table
  const { error } = await supabase.from("passport_applications").insert([
    {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      dob: formData.get("dob"),
      passport_type: formData.get("passport_type"),
      ssn: formData.get("ssn"),
      email: formData.get("email"),
      occupation: formData.get("occupation"),
      signature: fileUrl,
    },
  ]);

  status.textContent = error ? "Submission failed: " + error.message : "Application submitted successfully!";
});
