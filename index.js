import { supabase } from './supabaseClient.js';

const el = document.getElementById('index-form');
if (el) el.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('index.html submitted (logic not implemented yet).');
});