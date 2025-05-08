
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://injquzndhzqcamtenbum.supabase.co";
const supabaseKey = "YOUR_PUBLIC_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login failed: " + error.message);
  } else {
    window.location.href = "dashboard.html";
  }
}

function goToSignup() {
  window.location.href = "signup.html";
}

window.login = login;
window.goToSignup = goToSignup;
