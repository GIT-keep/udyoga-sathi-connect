// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://sygvcpqppgdehqttseho.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5Z3ZjcHFwcGdkZWhxdHRzZWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg3MjUsImV4cCI6MjA2NTgzNDcyNX0.FfVrA5FIgDYdUwklfGOsxgeqLJYiATeE0ZqhoV_6csM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);