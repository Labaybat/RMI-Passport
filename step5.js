import { supabase } from './supabaseClient.js';

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    alert('User not authenticated.');
    return;
  }
  const userId = authData.user.id;

  const form = e.target;
  const formData = new FormData(form);

  const signatureFile = formData.get('signature');
  const fileExt = signatureFile.name.split('.').pop();
  const filePath = `${userId}/signature.${fileExt}`;

  const { error: uploadError } = await supabase
    .storage
    .from('signatures')
    .upload(filePath, signatureFile, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('File upload error:', uploadError);
    alert('Failed to upload signature. Try again.');
    return;
  }

  const { data: publicUrlData } = supabase
    .storage
    .from('signatures')
    .getPublicUrl(filePath);
  const signatureUrl = publicUrlData.publicUrl;

  const record = {
    user_id: userId,
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    dob: formData.get('dob'),
    passport_type: formData.get('passport_type'),
    passport_number: formData.get('passport_number'),
    email: formData.get('email'),
    department: formData.get('department'),
    signature_url: signatureUrl
  };

  const { error: insertError } = await supabase
    .from('passport_applications')
    .insert([record]);

  if (insertError) {
    console.error('Insert error:', insertError);
    alert('Application submission failed.');
  } else {
    alert('Application submitted successfully!');
    form.reset();
  }
});
