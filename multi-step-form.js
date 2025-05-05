
const { createClient } = supabase;
const supabaseUrl = 'https://injquzndhzqcamtenbum.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluanF1em5kaHpxY2FtdGVuYnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODg1NTEsImV4cCI6MjA2MTk2NDU1MX0.pZnLipghLKXmWISsTUYK3WQl0cr_kJr39Ly571a3yew';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

let currentStep = 0;
const steps = document.querySelectorAll(".form-step");
const form = document.getElementById("passportForm");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const saveBtn = document.getElementById("saveBtn");
const submitBtn = document.getElementById("submitBtn");

function showStep(step) {
    steps.forEach((el, i) => {
        el.style.display = i === step ? "block" : "none";
    });
    prevBtn.style.display = step > 0 ? "inline" : "none";
    nextBtn.style.display = step < steps.length - 1 ? "inline" : "none";
    submitBtn.style.display = step === steps.length - 1 ? "inline" : "none";
}

showStep(currentStep);

nextBtn.addEventListener("click", async () => {
    await autoSave();
    if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
    }
});

prevBtn.addEventListener("click", () => {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
    }
});

saveBtn.addEventListener("click", async () => {
    await autoSave(true);
    alert("Application progress saved.");
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.submitted = true;
    data.created_at = new Date().toISOString();

    const user = await supabaseClient.auth.getUser();
    data.user_id = user.data.user?.id || null;

    const { error } = await supabaseClient.from("passport_applications").upsert(data, {
        onConflict: ["user_id"]
    });

    if (error) {
        alert("Submission error: " + error.message);
    } else {
        window.location.href = "dashboard.html";
    }
});

async function autoSave(isManual = false) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.updated_at = new Date().toISOString();
    if (!isManual) data.submitted = false;

    const user = await supabaseClient.auth.getUser();
    data.user_id = user.data.user?.id || null;

    await supabaseClient.from("passport_applications").upsert(data, {
        onConflict: ["user_id"]
    });
}