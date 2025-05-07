import { supabase } from './supabaseClient.js';

const el = document.getElementById('dashboard-form');
if (el) el.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('dashboard.html submitted (logic not implemented yet).');
});