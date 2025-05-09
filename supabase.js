
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://injquzndhzqcamtenbum.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a3VzbnRhbGx4ZHhyc2dkcXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTE3NjMsImV4cCI6MjA2MjA2Nzc2M30.-vsOMTTOo8";

export const supabase = createClient(supabaseUrl, supabaseKey);
