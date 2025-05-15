import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('recover-form');
  const email1 = document.getElementById('email1');
  const email2 = document.getElementById('email2');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    errorMessage.style.display = 'none';
    errorMessage.style.color = 'red';
    errorMessage.innerText = '';

    const emailVal1 = email1.value.trim();
    const emailVal2 = email2.value.trim();

    if (emailVal1 !== emailVal2) {
      errorMessage.innerText = 'Email addresses do not match.';
      errorMessage.style.display = 'block';
      return;
    }

    try {
      // Use RPC to check if email is registered without triggering rate limits
      const { data, error } = await supabase.rpc('get_user_by_email', { email: emailVal1 });

      if (error || !data) {
        errorMessage.innerText = 'No account found with this email.';
        errorMessage.style.display = 'block';
        return;
      }

      // If email is registered, send password reset
      const resetResult = await supabase.auth.resetPasswordForEmail(emailVal1, {
        redirectTo: window.location.origin + '/reset.html'
      });

      if (resetResult.error) {
        errorMessage.innerText = 'Error sending reset email: ' + resetResult.error.message;
        errorMessage.style.display = 'block';
      } else {
        errorMessage.innerText = 'Password reset email sent! Please check your inbox.';
        errorMessage.style.color = 'green';
        errorMessage.style.display = 'block';
      }

    } catch (err) {
      errorMessage.innerText = 'Unexpected error. Please try again.';
      errorMessage.style.display = 'block';
    }
  });
});
