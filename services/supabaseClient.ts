import { createClient } from '@supabase/supabase-js';

// Read from Environment Variables (injected via vite.config.ts)
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

// Fallback for development if env vars are missing (optional, but good for debugging)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase keys are missing! Authentication will not work. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file or Netlify settings.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

export type WebsiteProject = {
  id: string;
  user_id: string;
  prompt: string;
  code: string;
  created_at: string;
};