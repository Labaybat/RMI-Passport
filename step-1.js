import { supabase } from './supabaseClient.js';

const el = document.getElementById('step1-form');
if (el) el.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('step-1.html submitted (logic not implemented yet).');
});