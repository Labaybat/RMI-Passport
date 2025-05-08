
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
  if (data?.user) userId = data.user.id;
}

function nextStep() {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  currentStep++;
  document.getElementById(`step-${currentStep}`).style.display = 'block';
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
    if (!value.name) stepData[key] = value;
  });

  if (!userId) await getUser();

  if (!applicationId) {
    const { data, error } = await supabase
      .from('passport_applications')
      .insert([{ user_id: userId, status: 'draft', ...stepData }])
      .select()
      .single();
    if (data) applicationId = data.id;
  } else {
    await supabase
      .from('passport_applications')
      .update({ ...stepData, updated_at: new Date().toISOString() })
      .eq('id', applicationId);
  }
}

async function uploadFile(fieldName, file) {
  if (!userId || !applicationId || !file) return;
  const filePath = `${userId}/${fieldName}-${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('passport-documents')
    .upload(filePath, file, { upsert: true });
  if (!error) {
    const publicUrl = data.path;
    await supabase.from('passport_applications').update({ [fieldName]: publicUrl }).eq('id', applicationId);
  }
}

document.getElementById('application-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.name) {
      await uploadFile(key, value);
    }
  }

  await supabase
    .from('passport_applications')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', applicationId);

  alert('Application submitted successfully!');
  window.location.href = 'dashboard.html';
});

getUser();
