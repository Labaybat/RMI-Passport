
import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("finalForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const fileInput = document.getElementById("signature");
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a signature file.");
      return;
    }

    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("passport_applications")
      .insert([{
        user_id: user.id,
        signature: filePath
      }]);

    if (insertError) {
      alert("Application submission failed: " + insertError.message);
    } else {
      alert("Application submitted successfully!");
      window.location.href = "confirmation.html";
    }
  });
});
