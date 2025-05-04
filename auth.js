
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://injquzndhzqcamtenbum.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  window.location.href = "login.html";
}
