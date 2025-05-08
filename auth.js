
window.addEventListener("load", () => {
  const supabase = window.supabase.createClient(
    "https://injquzndhzqcamtenbum.supabase.co",
    "YOUR_PUBLIC_ANON_KEY"
  );

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
});
