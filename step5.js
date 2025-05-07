import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("final-step-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      alert("User not authenticated.");
      return;
    }

    const user_id = userData.user.id;
    const formData = new FormData(form);
    const signatureFile = formData.get("signature");

    let signaturePath = "";
    if (signatureFile && signatureFile.name) {
      const fileExt = signatureFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user_id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("signatures").upload(filePath, signatureFile);
      if (uploadError) {
        alert("Signature upload failed: " + uploadError.message);
        return;
      }
      signaturePath = filePath;
    }

    const payload = {
      user_id,
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      dob: formData.get("dob"),
      passport_type: formData.get("passport_type"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      occupation: formData.get("occupation"),
      signature: signaturePath,
      sign_date: new Date().toISOString(),
      status: "submitted"
    };

    const { error } = await supabase.from("passport_applications").insert([payload]);
    if (error) {
      alert("Submission error: " + error.message);
    } else {
      alert("Application submitted successfully!");
      window.location.href = "confirmation.html";
    }
  });
});
