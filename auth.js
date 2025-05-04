
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://injquzndhzqcamtenbum.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluanF1em5kaHpxY2FtdGVuYnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODg1NTEsImV4cCI6MjA2MTk2NDU1MX0.pZnLipghLKXmWISsTUYK3WQl0cr_kJr39Ly571a3yew'
);

const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  window.location.href = "login.html";
}
