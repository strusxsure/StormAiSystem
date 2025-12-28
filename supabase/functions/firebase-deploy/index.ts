
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Helper function to create a consistent CORS response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Extract parameters from the incoming request body
    const { projectId, apiToken, zip } = await req.json();
    if (!projectId || !apiToken || !zip) {
      throw new Error('Project ID, API token, and zip file are required.');
    }

    // The zip comes in as a plain array of bytes, so we convert it back to a Uint8Array
    const zipBuffer = new Uint8Array(zip);
    const siteName = `sites/${projectId}`;

    // --- Firebase Deployment Steps ---

    // 3. Step 1: Specify the files to upload to Firebase Hosting.
    // We get a signed URL from Firebase where we can upload our zipped code.
    const populateFilesResponse = await fetch(`https://firebasehosting.googleapis.com/v1beta1/${siteName}/versions/-/populateFiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        // We don't need to list files here since we are uploading a zip
      }),
    });

    if (!populateFilesResponse.ok) {
        const errorData = await populateFilesResponse.json();
        console.error('Populate files error:', errorData);
        throw new Error(`Firebase error (populateFiles): ${errorData.error.message}`);
    }
    const { uploadUrl, uploadRequiredHashes } = await populateFilesResponse.json();

    // If no files need uploading, we can short-circuit and finalize the deployment
    if (!uploadRequiredHashes || uploadRequiredHashes.length === 0) {
        console.log("No files needed to be uploaded.");
    } else {
        // 4. Step 2: Upload the zip file to the signed URL provided by Firebase.
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/zip',
          },
          body: zipBuffer,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload error:', errorText);
          throw new Error(`Firebase error (upload): ${errorText}`);
        }
    }

    // 5. Step 3: Finalize the deployment, making it live.
    const finalizeResponse = await fetch(`https://firebasehosting.googleapis.com/v1beta1/${siteName}/versions/-/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json();
        console.error('Finalize error:', errorData);
        throw new Error(`Firebase error (finalize): ${errorData.error.message}`);
    }

    const { name: versionName } = await finalizeResponse.json();

    // 6. Step 4: Release the new version to the live channel.
     const releaseResponse = await fetch(`https://firebasehosting.googleapis.com/v1beta1/${siteName}/releases?versionName=${versionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!releaseResponse.ok) {
        const errorData = await releaseResponse.json();
        console.error('Release error:', errorData);
        throw new Error(`Firebase error (release): ${errorData.error.message}`);
    }

    // 7. Success! Return the live URL of the deployed site.
    const deploymentUrl = `https://${projectId}.web.app`;
    return new Response(JSON.stringify({ deploymentUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // 8. Handle any errors that occurred during the process
    console.error('Function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
