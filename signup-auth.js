
import { supabase } from './supabase.js';

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email')?.value;
  const firstName = document.getElementById('firstName')?.value;
  const lastName = document.getElementById('lastName')?.value;
  const phone = document.getElementById('phone')?.value;
  const password = document.getElementById('password')?.value;
  const confirm = document.getElementById('confirm-password')?.value;

  const btn = document.querySelector(".login-button");
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

  const { error } = await supabase.auth.signUp({ email, password, options: { data: { email, firstName, lastName, phone } } });

  if (error) {
    alert(error.message);
    btn.innerText = "Sign Up";
    btn.disabled = false;
  } else {
    alert("Signup successful. Please check your email.");
    window.location.href = "dashboard.html";
  }
});
