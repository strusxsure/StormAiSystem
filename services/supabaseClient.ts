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

export type UserProfile = {
  id: string;
  email?: string; // Optional for display
  credits: number;
  tier: 'free' | 'pro' | 'enterprise';
  full_name?: string;
};

// --- PROFILE HELPERS ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
       // If table doesn't exist or row doesn't exist, return default mock
       // This ensures the app works even if the user hasn't set up the 'profiles' table yet.
       console.warn("Could not fetch profile (using mock):", error.message);
       return { id: userId, credits: 5, tier: 'free' }; 
    }
    
    return data as UserProfile;
  } catch (e) {
    return { id: userId, credits: 5, tier: 'free' };
  }
};

export const updateUserCredits = async (userId: string, newCredits: number) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);
            
        if (error) throw error;
        return true;
    } catch (e) {
        console.warn("Failed to update credits in DB (using local state only):", e);
        return false;
    }
};

export const getAllProfiles = async (): Promise<UserProfile[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
        if (error) throw error;
        return data as UserProfile[];
    } catch (e) {
        console.error("Failed to fetch all profiles", e);
        return [];
    }
}
