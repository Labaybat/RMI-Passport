import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://svkusntallxdxrsgdqzt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a3VzbnRhbGx4ZHhyc2dkcXp0aXFmIiwiaWF0IjoxNzE1MDIzNDY4LCJleHAiOjE3NDY1ODk0Njh9.4xMLbfCUHNjcGvAeU4m4ASZgWk3MKrcYlIvQauzj8Rg'
)


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("final-step-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const supabase = createClient(
      "https://svkusntallxdrsgdqzt.supabase.co",
      "eyJh...<REDACTED>...NDUw" // Replace with a safe key in production
    );

    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      alert("User not authenticated.");
      return;
    }

    const user_id = user.data.user.id;
    const formData = new FormData(form);
    const payload = {
      user_id,
      first_name: formData.get("first_name"),
      middle_name: formData.get("middle_name"),
      last_name: formData.get("last_name"),
      dob: formData.get("dob"),
      place_of_birth: formData.get("place_of_birth"),
      gender: formData.get("gender"),
      marital_status: formData.get("marital_status"),
      ssn: formData.get("ssn"),
      nationality: formData.get("nationality"),
      passport_type: formData.get("passport_type"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zip: formData.get("zip"),
      atoll: formData.get("atoll"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      occupation: formData.get("occupation"),
      employer_name: formData.get("employer_name"),
      employer_address: formData.get("employer_address"),
      height: formData.get("height"),
      hair_color: formData.get("hair_color"),
      eye_color: formData.get("eye_color"),
      emergency_name: formData.get("emergency_name"),
      emergency_relation: formData.get("emergency_relation"),
      emergency_phone: formData.get("emergency_phone"),
      signature: formData.get("signature"),
      sign_date: formData.get("sign_date"),
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
