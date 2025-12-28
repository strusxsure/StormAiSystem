import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accessToken, projectName, existingSiteId, zipFileBuffer } = await req.json();

    let siteId = existingSiteId;

    if (!siteId) {
      const siteResponse = await fetch(`${NETLIFY_API_BASE}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: projectName }),
      });
      const siteData = await siteResponse.json();
      if (!siteResponse.ok) {
        return new Response(JSON.stringify(siteData), { status: siteResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      siteId = siteData.id;
    }

    const deployResponse = await fetch(`${NETLIFY_API_BASE}/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: new Uint8Array(zipFileBuffer.data),
    });

    const deployData = await deployResponse.json();
    if (!deployResponse.ok) {
      return new Response(JSON.stringify(deployData), { status: deployResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const responseData = {
      siteId: siteId,
      deploymentUrl: deployData.deploy_ssl_url,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
