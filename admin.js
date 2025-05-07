import { supabase } from './supabaseClient.js';

const el = document.getElementById('admin-form');
if (el) el.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('admin.html submitted (logic not implemented yet).');
});