import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Pass Environment Variables to the client side
      'process.env.API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY || ''),
      'process.env.MISTRAL_API_KEY': JSON.stringify(env.VITE_MISTRAL_API_KEY || ''),
    },
  }
})