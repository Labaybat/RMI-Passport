
import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("Login failed: " + error.message);
      } else {
        window.location.href = "dashboard.html";
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = registerForm.email.value;
      const password = registerForm.password.value;

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert("Signup failed: " + error.message);
      } else {
        alert("Signup successful. Please log in.");
        window.location.href = "login.html";
      }
    });
  }
});
