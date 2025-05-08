
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://eiuviyizjnfmswfrdigo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXZpeWl6am5mbXN3ZnJkaWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Nzc1MDIsImV4cCI6MjA2MjI1MzUwMn0.M1E6xOKAc8fsiVkXAxorr1QCRqRedcDv-GNa9CuAE4M";

export const supabase = createClient(supabaseUrl, supabaseKey);
