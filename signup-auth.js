import { supabase } from './supabase.js';

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const firstName = document.getElementById('first-name')?.value;
const lastName = document.getElementById('last-name')?.value;
const phoneNumber = document.getElementById('phone-number')?.value;
const email = document.getElementById('signup-email')?.value;
  const password = document.getElementById('signup-password')?.value;
  const confirm = document.getElementById('confirm-password')?.value;

  const btn = document.querySelector(".signup-btn");
  btn.innerText = "Signing up...";
  btn.disabled = true;

  if (!email || !password || !confirm) {
    alert("Please fill out all fields.");
    btn.innerText = "Sign Up";
    btn.disabled = false;
    return;
  }

  if (password !== confirm) {
    alert("Passwords do not match.");
    btn.innerText = "Sign Up";
    btn.disabled = false;
    return;
  }

  const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      first_name: firstName,
      last_name: lastName,
      phone: phoneNumber
    }
  }
});

  if (error) {
  console.error(error);

    alert("Sign up failed: " + error.message);
  } else {
  document.getElementById("signupSuccessModal").style.display = "flex";
    
  }

  btn.innerText = "Sign Up";
  btn.disabled = false;
});