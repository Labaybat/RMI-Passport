
import { supabase } from './supabase.js';

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("application-form");
  const steps = document.querySelectorAll(".step");
  let currentStep = 0;

  function showStep(index) {
    steps.forEach((step, i) => {
      step.style.display = i === index ? "block" : "none";
    });
  }

  function getFormData() {
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }

  document.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    });
  });

  document.querySelectorAll(".prev-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.getElementById("loader").style.display = "flex";

    const formData = getFormData();
    const user = await supabase.auth.getUser();

    if (user.data && user.data.user) {
      formData.user_id = user.data.user.id;
    }

    const { error } = await supabase.from("passport_applications").insert([formData]);

    document.getElementById("loader").style.display = "none";

    if (error) {
      alert("Error submitting application: " + error.message);
    } else {
      alert("Application submitted successfully!");
      window.location.href = "dashboard.html";
    }
  });

  showStep(currentStep);
});
