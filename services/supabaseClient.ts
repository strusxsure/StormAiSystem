import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdmcmgfqvsleuracyqkc.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZR8s8S3DtORGZ_SE3krb5w_aZLQ-em7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type WebsiteProject = {
  id: string;
  user_id: string;
  prompt: string;
  code: string;
  created_at: string;
};
