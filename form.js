

import { createClient } from 'https://esm.sh/@supabase/supabase-js'

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

    // Try to fetch existing draft
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
      .insert([{ user_id: userId, status: 'draft', application_type: stepData.application_type, ...stepData }])
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

  btn.addEventListener('click', nextStep);
});
  btn.addEventListener('click', prevStep);
});

getUser();



  btn.addEventListener('click', prevStep);
});
  btn.addEventListener('click', nextStep);
});

document.querySelectorAll('.upload-area').forEach(area => {
  const targetId = area.dataset.target;
  const input = document.getElementById(targetId);
  const preview = document.getElementById(`${targetId}_preview`);

  area.addEventListener('click', () => input.click());

  area.addEventListener('dragover', e => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('dragover');
    input.files = e.dataTransfer.files;
    preview.textContent = input.files[0]?.name || '';
  });

  input.addEventListener('change', () => {
    preview.textContent = input.files[0]?.name || '';
  });
});

document.getElementById('reviewBtn')?.addEventListener('click', () => {
  const form = document.getElementById('application-form');
  const formData = new FormData(form);

  const labelMap = {
    application_type: "Application Type",
    surname: "Surname or Family Name",
    first_middle_names: "First and Middle Names",
    social_security_number: "Social Security Number",
    place_of_birth_city: "City or Town of Birth",
    place_of_birth_state: "State (if in U.S.)",
    country_of_birth: "Country of Birth",
    date_of_birth: "Date of Birth",
    gender: "Gender",
    hair_color: "Hair Color",
    marital_status: "Marital Status",
    height_feet: "Height (Feet)",
    height_inches: "Height (Inches)",
    eye_color: "Eye Color",
    address_unit: "Address Unit",
    street_name: "Street Name",
    phone_number: "Phone Number",
    city: "City",
    state: "State",
    postal_code: "Postal Code",
    emergency_full_name: "Emergency Contact Full Name",
    emergency_phone_number: "Emergency Phone Number",
    emergency_address_unit: "Emergency Address Unit",
    emergency_street_name: "Emergency Street Name",
    emergency_city: "Emergency City",
    emergency_state: "Emergency State",
    emergency_postal_code: "Emergency Postal Code",
    father_full_name: "Father's Full Name",
    father_dob: "Father's Date of Birth",
    father_nationality: "Father's Nationality",
    father_birth_city: "Father's City of Birth",
    father_birth_state: "Father's State of Birth",
    father_birth_country: "Father's Country of Birth",
    mother_full_name: "Mother's Full Name",
    mother_dob: "Mother's Date of Birth",
    mother_nationality: "Mother's Nationality",
    mother_birth_city: "Mother's City of Birth",
    mother_birth_state: "Mother's State of Birth",
    mother_birth_country: "Mother's Country of Birth"
  };

  const entries = Array.from(formData.entries());
  const content = entries.map(([key, val]) => {
    const label = labelMap[key] || key.replaceAll('_', ' ');
    return `<div><strong>${label}:</strong> ${val}</div>`;
  }).join('');
  document.getElementById('reviewContent').innerHTML = content;
  document.getElementById('reviewModal').style.display = 'flex';
});

document.getElementById('closeReviewBtn')?.addEventListener('click', () => {
  document.getElementById('reviewModal').style.display = 'none';
});

  btn.addEventListener("click", nextStep);
});

  btn.addEventListener("click", prevStep);
});


    btn.addEventListener("click", prevStep);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const step1 = document.getElementById("step-1");
  if (step1) step1.style.display = "block";

  document.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", nextStep);
  });

  document.querySelectorAll(".prev-btn").forEach(btn => {
    btn.addEventListener("click", prevStep);
  });
});
