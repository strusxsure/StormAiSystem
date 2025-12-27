import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

const NETLIFY_OAUTH_URL = 'https://api.netlify.com/oauth/token';
const CLIENT_ID = Deno.env.get('NETLIFY_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('NETLIFY_CLIENT_SECRET');

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Authorization code is missing.', { status: 400 });
  }

  try {
    const response = await fetch(NETLIFY_OAUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/netlify-oauth-callback`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Failed to get access token: ${errorText}`, { status: response.status });
    }

    const { access_token } = await response.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response('User not authenticated.', { status: 401 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ netlify_access_token: access_token })
      .eq('id', user.id);

    if (error) {
      return new Response(`Failed to save access token: ${error.message}`, { status: 500 });
    }

    return new Response('Successfully connected to Netlify!', {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    return new Response(`An unexpected error occurred: ${error.message}`, { status: 500 });
  }
});
