
import { supabase } from './supabase.js';

let currentStep = 1;
let userId = null;
let applicationId = null;

async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (data?.user?.id) {
    userId = data.user.id;
    console.log("User ID:", userId);
  } else {
    alert("Failed to fetch user session.");
  }
}

function showStep(step) {
  document.querySelectorAll(".step").forEach((el) => el.style.display = "none");
  const current = document.getElementById(`step-${step}`);
  if (current) current.style.display = "block";
}

function nextStep() {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  currentStep++;
  const next = document.getElementById(`step-${currentStep}`);
  if (next) next.style.display = 'block';
  saveStep();
}

function prevStep() {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  currentStep--;
  document.getElementById(`step-${currentStep}`).style.display = 'block';
}

async function saveStep() {
  const form = document.getElementById('application-form');
  const formData = new FormData(form);
  const stepData = {};
  formData.forEach((value, key) => {
    if (!(value instanceof File)) stepData[key] = value === '' ? null : value;
  });

  if (!userId) await getUser();
  if (!userId) return;

  if (!applicationId) {
    const { data, error } = await supabase
      .from('passport_applications')
      .insert([{ user_id: userId, status: 'draft', ...stepData }])
      .select()
      .single();
    if (data) {
      applicationId = data.id;
      console.log("Created new application ID:", applicationId);
    } else if (error) {
      console.error("Insert error:", error);
    }
  } else {
    const { error } = await supabase
      .from('passport_applications')
      .update({ ...stepData, updated_at: new Date().toISOString() })
      .eq('id', applicationId);
    if (error) console.error("Update error:", error);
  }
}

async function submitApplication() {
  const form = document.getElementById('application-form');
  const formData = new FormData(form);
  const allData = {};
  formData.forEach((value, key) => {
    if (!(value instanceof File)) allData[key] = value === '' ? null : value;
  });

  const submitButton = document.getElementById('submit-btn');
  submitButton.disabled = true;
  submitButton.innerText = 'Submitting...';

  if (!userId) await getUser();
  if (!userId || !applicationId) return;

  const { error } = await supabase
    .from('passport_applications')
    .update({ ...allData, status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', applicationId);

  submitButton.disabled = false;
  submitButton.innerText = 'Submit';

  if (!error) {
    alert('✅ Your application has been submitted successfully!');
    window.location.href = 'dashboard.html';
  } else {
    alert('❌ Submission failed: ' + error.message);
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await getUser();
  showStep(currentStep);

  document.querySelectorAll(".next-btn").forEach((btn) =>
    btn.addEventListener("click", nextStep)
  );
  document.querySelectorAll(".prev-btn").forEach((btn) =>
    btn.addEventListener("click", prevStep)
  );

  document.getElementById("submit-btn")?.addEventListener("click", submitApplication);
});
