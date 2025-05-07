document.addEventListener('DOMContentLoaded', function () {
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://svkusntallxdxrsgdqzt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImFub24iLCJpYXQiOjE2OTg3NzEwNTcsImV4cCI6MjAxNDM0NzA1N30.s8oPZtBvvV4Eh3nG3T3MjRkmUozsmVfSyCrB7B1z_yo'
);

document.getElementById('final-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    alert("User not authenticated.");
    return;
  }

  const formData = new FormData(e.target);
  const signatureFile = formData.get('signature');

  let signaturePath = '';
  if (signatureFile && signatureFile.name) {
    const filePath = `${user.data.user.id}/${Date.now()}_${signatureFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(filePath, signatureFile, { cacheControl: '3600', upsert: true });
    if (uploadError) {
      alert("Upload error: " + uploadError.message);
      return;
    }
    signaturePath = filePath;
  }

  const { error } = await supabase.from('passport_applications').insert([
    {
      user_id: user.data.user.id,
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      dob: formData.get('dob'),
      passport_type: formData.get('passport_type'),
      ssn: formData.get('ssn'),
      email: formData.get('email'),
      occupation: formData.get('occupation'),
      signature: signaturePath,
      sign_date: new Date().toISOString(),
      status: 'submitted'
    }
  ]);

  if (error) {
    alert("Submission failed: " + error.message);
  } else {
    alert("Application submitted successfully.");
    window.location.href = 'confirmation.html';
  }
});

});