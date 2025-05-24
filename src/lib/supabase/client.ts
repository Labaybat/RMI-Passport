/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // add more env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export a single Supabase client instance
const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
export default supabase;
