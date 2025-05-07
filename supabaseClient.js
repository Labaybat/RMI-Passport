import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.42.3/+esm';

// Use environment variables if available (for Vercel deployments)
export const supabase = createClient(
  window.SUPABASE_URL || 'https://svkusntallxnsdgadzt.supabase.co',
  window.SUPABASE_ANON_KEY || 'eyJh...NDw' // replace with your anon key in deployment env
);
