// netlify/functions/deployToNetlify.ts
import { Handler } from '@netlify/functions';
import crypto from 'crypto';
import fetch from 'node-fetch';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { htmlContent, siteId: existingSiteId } = JSON.parse(event.body || '{}');
    if (!htmlContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing htmlContent in request body' }),
      };
    }

    const netlifyToken = process.env.NETLIFY_AUTH_TOKEN;
    if (!netlifyToken) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Netlify auth token is not configured.' }),
        };
    }

    let siteId = existingSiteId;
    let siteData;

    if (!siteId) {
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!siteResponse.ok) {
        const errorText = await siteResponse.text();
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Failed to create Netlify site: ${errorText}` }),
        };
      }
      siteData = await siteResponse.json();
      siteId = siteData.site_id;
    }

    // Step 1: Create a digest of the file content
    const sha1 = crypto.createHash('sha1');
    sha1.update(htmlContent);
    const digest = sha1.digest('hex');

    // Step 2: Post the file digest to Netlify to create a new deploy
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          '/index.html': digest,
        },
      }),
    });

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ message: `Failed to create deploy on Netlify: ${errorText}` }),
      };
    }

    const deployData = await deployResponse.json();
    const deployId = deployData.id;

    // Step 3: Upload the actual file content
    const fileUploadResponse = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/octet-stream',
        },
        body: htmlContent,
    });

    if (!fileUploadResponse.ok) {
        const errorText = await fileUploadResponse.text();
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Failed to upload file to Netlify: ${errorText}` }),
        };
    }

    // After uploading all files, Netlify will process the deploy.
    // The final deploy status can be checked, but for a single file it's usually quick.
    // The URL is available from the initial deploy creation response.
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Deployment successful!',
        url: deployData.ssl_url || `https://${siteId}.netlify.app`,
        siteId: siteId,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An error occurred during deployment',
        error: error.message,
      }),
    };
  }
};

export { handler };
