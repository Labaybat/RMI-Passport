
import { supabase } from './supabase.js';

let currentStep = 1;
const totalSteps = 5;
let formData = {};
let userId = null;
let applicationId = null;

// Move between steps
function showStep(step) {
  document.querySelectorAll('.step').forEach((el, index) => {
    el.style.display = index === step - 1 ? 'block' : 'none';
  });
}

function updateFormDataFromInputs() {
  const inputs = document.querySelectorAll('#application-form input, #application-form select, #application-form textarea');
  inputs.forEach(input => {
    formData[input.name] = input.value;
  });
}

async function saveToSupabase() {
  updateFormDataFromInputs();
  const payload = {
    user_id: userId,
    ...formData
  };

  if (applicationId) {
    await supabase.from('passport_application').update(payload).eq('id', applicationId);
  } else {
    const { data, error } = await supabase.from('passport_application').insert(payload).select().single();
    if (!error) applicationId = data.id;
  }
}

document.getElementById('next-btn')?.addEventListener('click', async () => {
  if (currentStep < totalSteps) {
    await saveToSupabase();
    currentStep++;
    showStep(currentStep);
  }
});

document.getElementById('back-btn')?.addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
});

// Load existing data on load
async function initForm() {
  const session = await supabase.auth.getSession();
  if (!session.data?.session) {
    window.location.href = 'index.html';
    return;
  }
  userId = session.data.session.user.id;

  const { data, error } = await supabase.from('passport_application').select('*').eq('user_id', userId).single();
  if (data) {
    formData = data;
    applicationId = data.id;
    Object.entries(data).forEach(([key, value]) => {
      const input = document.querySelector(`[name="${key}"]`);
      if (input) input.value = value;
    });
  }

  showStep(currentStep);
}

window.addEventListener('DOMContentLoaded', initForm);
