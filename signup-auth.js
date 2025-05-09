import { supabase } from './supabase.js';

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
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

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert("Sign up failed: " + error.message);
  } else {
    const modal = document.createElement("div");
    modal.innerHTML = `<div style='background:#fff;border:2px solid red;padding:20px;text-align:center;position:fixed;top:30%;left:50%;transform:translate(-50%,-50%);z-index:1000'>
      ✅ Account created! Please check your email to confirm before logging in.<br/><br/>
      <button onclick="window.location.href='index.html'">OK</button>
    </div>`;
    document.body.appendChild(modal);
  }

  btn.innerText = "Sign Up";
  btn.disabled = false;
});