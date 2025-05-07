import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
