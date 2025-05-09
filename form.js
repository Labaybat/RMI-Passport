
let currentStep = 1;
const loader = document.getElementById("loader");
const steps = document.querySelectorAll(".step");
const form = document.getElementById("application-form");
let userId = null;
let applicationId = null;

// Step navigation
function showStep(step) {
  steps.forEach((s, i) => s.classList.toggle("active", i === step - 1));
  currentStep = step;
}

// Step buttons
document.getElementById("next-1").onclick = () => { showStep(2); saveStep(); };
document.getElementById("back-2").onclick = () => showStep(1);
document.getElementById("next-2").onclick = () => { showStep(3); saveStep(); };
document.getElementById("back-3").onclick = () => showStep(2);

// Initialize user session
async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    alert("Please log in.");
    window.location.href = "index.html";
    return;
  }
  userId = data.user.id;
}

// Save current step to Supabase
async function saveStep() {
  const formData = {
    application_type: document.getElementById("application_type")?.value,
    surname: document.getElementById("surname")?.value,
    first_middle_names: document.getElementById("first_middle_names")?.value,
    social_security_number: document.getElementById("social_security_number")?.value,
    phone_number: document.getElementById("phone_number")?.value,
    city: document.getElementById("city")?.value,
    postal_code: document.getElementById("postal_code")?.value,
    emergency_contact_name: document.getElementById("emergency_contact_name")?.value,
    emergency_contact_phone: document.getElementById("emergency_contact_phone")?.value,
  };

  if (!userId) await getUser();
  if (!userId) return;

  if (!applicationId) {
    const { data, error } = await supabase
      .from("passport_applications")
      .insert([{ user_id: userId, status: "draft", ...formData }])
      .select()
      .single();
    if (data) applicationId = data.id;
  } else {
    await supabase
      .from("passport_applications")
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq("id", applicationId);
  }
}

// Final submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  loader.style.display = "flex";

  await saveStep();

  if (applicationId) {
    await supabase
      .from("passport_applications")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", applicationId);
  }

  loader.style.display = "none";
  window.location.href = "thankyou.html";
});

// Run on load
getUser().then(async () => {
  
  const editingId = localStorage.getItem("editingApplicationId");
  if (editingId) {
    const { data, error } = await supabase
      .from("passport_applications")
      .select("*")
      .eq("id", editingId)
      .single();
    if (data) {
      applicationId = data.id;
      document.getElementById("application_type").value = data.application_type || "";
      document.getElementById("surname").value = data.surname || "";
      document.getElementById("first_middle_names").value = data.first_middle_names || "";
      document.getElementById("social_security_number").value = data.social_security_number || "";
      document.getElementById("phone_number").value = data.phone_number || "";
      document.getElementById("city").value = data.city || "";
      document.getElementById("postal_code").value = data.postal_code || "";
      document.getElementById("emergency_contact_name").value = data.emergency_contact_name || "";
      document.getElementById("emergency_contact_phone").value = data.emergency_contact_phone || "";
    }
    localStorage.removeItem("editingApplicationId");
  }

});
