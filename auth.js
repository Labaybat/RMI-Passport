
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('auth-form');
  const toggleLink = document.getElementById('toggle-link');
  const formTitle = document.getElementById('form-title');
  const authButton = document.getElementById('auth-button');

  let isLogin = true;

  toggleLink.addEventListener('click', () => {
    isLogin = !isLogin;
    formTitle.innerText = isLogin ? 'Login' : 'Sign Up';
    authButton.innerText = isLogin ? 'Login' : 'Sign Up';
    toggleLink.innerText = isLogin
      ? 'Don\'t have an account? Sign Up'
      : 'Already have an account? Login';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return alert('Login failed: ' + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return alert('Sign up failed: ' + error.message);
    }

    window.location.href = 'dashboard.html';
  });
});
