import { supabase } from './supabaseClient.js';

const el = document.getElementById('step2-form');
if (el) el.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('step-2.html submitted (logic not implemented yet).');
});