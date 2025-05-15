import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('reset-form');
  const newPassword = document.getElementById('new-password');
  const confirmPassword = document.getElementById('confirm-password');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    errorMessage.style.display = 'none';
    errorMessage.style.color = 'red';
    errorMessage.innerText = '';

    const password1 = newPassword.value.trim();
    const password2 = confirmPassword.value.trim();

    if (password1 !== password2) {
      errorMessage.innerText = 'Passwords do not match.';
      errorMessage.style.display = 'block';
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: password1 });

      if (error) {
        errorMessage.innerText = 'Something went wrong. Please try again.';
        errorMessage.style.display = 'block';
      } else {
        errorMessage.innerText = 'Your password has been updated.';
        errorMessage.style.color = 'green';
        errorMessage.style.display = 'block';
      }
    } catch (err) {
      errorMessage.innerText = 'Unexpected error. Please try again.';
      errorMessage.style.display = 'block';
    }
  });
});
