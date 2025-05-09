
import { supabase } from './supabase.js';

let currentStep = 1;
let userId = null;
let applicationId = null;

async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (data?.user?.id) {
    userId = data.user.id;
    console.log("User ID:", userId);

    const { data: existing, error: fetchError } = await supabase
      .from('passport_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .limit(1)
      .maybeSingle();

    if (existing) {
      applicationId = existing.id;
      console.log("Loaded draft application ID:", applicationId);
    }
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
      console.log("Created application ID:", applicationId);
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

async function uploadFile(fieldName, file) {
  if (!userId || !applicationId || !file || file.size === 0) return;
  const filePath = `${userId}/${fieldName}-${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('passport-documents')
    .upload(filePath, file, { upsert: true });
  if (!error) {
    const publicUrl = data.path;
    await supabase
      .from('passport_applications')
      .update({ [fieldName]: publicUrl })
      .eq('id', applicationId);
  } else {
    console.error('Upload error:', error.message);
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
});
