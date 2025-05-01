
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://hvycjokchqstzhwbpves.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eWNqb2tjaHFzdHpod2JwdmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTYyMTIsImV4cCI6MjA2MTY3MjIxMn0.Vrl9r_f5NWe0KbO_c3QqiHVMZVgXofCFpJ4BjnnVN0o";

const form = document.querySelector('form');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = {
    first_name: formData.get('firstName'),
    last_name: formData.get('lastName'),
    dob: formData.get('dob'),
    birth_place: formData.get('birthPlace'),
    nationality: formData.get('nationality'),
    sex: formData.get('sex'),
    height: formData.get('height'),
    eye_color: formData.get('eyeColor'),
    hair_color: formData.get('hairColor'),
    home_address: formData.get('homeAddress'),
    mailing_address: formData.get('mailingAddress'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    father_name: formData.get('fatherName'),
    father_pob: formData.get('fatherPOB'),
    mother_name: formData.get('motherName'),
    mother_pob: formData.get('motherPOB'),
    has_passport: formData.get('hasPassport') === "Yes",
    signature: formData.get('signature'),
    application_date: formData.get('applicationDate'),
  };

  const { error } = await supabase.from('passport_applications').insert([data]);

  if (error) {
    alert("Error submitting application.");
    console.error(error);
  } else {
    alert("Application submitted successfully!");
    form.reset();
  }
});
