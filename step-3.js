import { supabase } from './supabaseClient.js';

const el = document.getElementById('step3-form');
if (el) el.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('step-3.html submitted (logic not implemented yet).');
});