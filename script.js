// This script handles saving form data to Supabase
document.addEventListener('DOMContentLoaded', async function () {
    const { createClient } = supabase;
    const supabaseUrl = 'https://injquzndhzqcamtenbum.supabase.co';
    const supabaseKey = 'YOUR_SUPABASE_PUBLIC_ANON_KEY';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    async function getUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    }

    async function saveFormData(formData) {
        const user = await getUser();
        if (!user) {
            alert('User not authenticated');
            return;
        }
        const { error } = await supabaseClient.from('passport_applications').upsert([
            {
                user_id: user.id,
                form_data: formData,
                submitted: false
            }
        ]);
        if (error) console.error('Error saving form:', error);
        else console.log('Form saved successfully');
    }

    // Example usage on a form submit
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(form).entries());
            await saveFormData(formData);
        });
    }
});
