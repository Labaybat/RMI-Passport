
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
  'https://eiuviyizjnfmswfrdigo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXZpeWl6am5mbXN3ZnJkaWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Nzc1MDIsImV4cCI6MjA2MjI1MzUwMn0.M1E6xOKAc8fsiVkXAxorr1QCRqRedcDv-GNa9CuAE4M'
);

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
    if (!(value instanceof File)) stepData[key] = value;
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
    console.error(`Upload error for ${fieldName}:`, error);
  }
}

document.getElementById('application-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!userId) await getUser();
  if (!userId) return;

  const form = e.target;
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      await uploadFile(key, value);
    }
  }

  const { error } = await supabase
    .from('passport_applications')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) {
    alert("Error submitting application.");
    console.error("Submission error:", error);
  } else {
    alert('Application submitted successfully!');
    window.location.href = 'dashboard.html';
  }
});

getUser();
