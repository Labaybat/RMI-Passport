
// Declare loader and button
const loader = document.getElementById("loader");
const submitButton = document.getElementById("submit-button");

// Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabase = createClient(
  'https://eiuviyizjnfmswfrdigo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXZpeWl6am5mbXN3ZnJkaWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Nzc1MDIsImV4cCI6MjA2MjI1MzUwMn0.M1E6xOKAc8fsiVkXAxorr1QCRqRedcDv-GNa9CuAE4M'
);

// User and step state
let userId = null;
let currentStep = 1;

// Step Navigation
function showStep(step) {
  const steps = document.querySelectorAll(".step");
  steps.forEach((s, i) => {
    s.style.display = i + 1 === step ? "block" : "none";
  });
}

function nextStep() {
  const steps = document.querySelectorAll(".step");
  if (currentStep < steps.length) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

window.addEventListener("load", () => {
  showStep(currentStep);
});

// Get logged-in user
async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (data?.user?.id) {
    userId = data.user.id;
  } else {
    alert("Session expired. Please log in again.");
  }
}

// Form submission
submitButton.addEventListener("click", async () => {
  loader.style.display = "block";
  submitButton.disabled = true;

  try {
    const form = document.getElementById("application-form");
    const formData = new FormData(form);
    const applicationData = {};

    formData.forEach((value, key) => {
      applicationData[key] = value === "" ? null : value;
    });

    if (!userId) await getUser();
    if (!userId) return;

    const { error } = await supabase.from("passport_applications").insert([
      {
        ...applicationData,
        user_id: userId,
        status: "submitted",
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      alert("Application submission failed.");
    } else {
      alert("Application submitted successfully!");
      window.location.href = "dashboard.html";
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("Something went wrong.");
  } finally {
    loader.style.display = "none";
    submitButton.disabled = false;
  }
});
