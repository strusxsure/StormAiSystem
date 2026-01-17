// netlify/functions/deployToNetlify.ts
import { Handler } from '@netlify/functions';
import JSZip from 'jszip';
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

    const zip = new JSZip();
    zip.file('index.html', htmlContent);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

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

    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/zip',
      },
      body: zipBuffer,
    });

    if (!deployResponse.ok) {
        const errorText = await deployResponse.text();
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Failed to deploy to Netlify: ${errorText}` }),
        };
    }

    const deployData = await deployResponse.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Deployment successful!',
        url: deployData.ssl_url,
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
