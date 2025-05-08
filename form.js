// Placeholder for multi-step form logic (expandable)
let currentStep = 1;
function nextStep() {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  currentStep++;
  const next = document.getElementById(`step-${currentStep}`);
  if (next) next.style.display = 'block';
}
