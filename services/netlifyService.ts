
import { Buffer } from 'buffer';
import JSZip from 'jszip';

export interface NetlifyDeploymentResult {
  siteId: string;
  deploymentUrl: string;
}

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

/**
 * Deploys a new site to Netlify.
 *
 * @param htmlCode The raw HTML string to deploy.
 * @param apiToken The user's Netlify API token.
 * @param siteName A name for the Netlify site.
 * @returns A promise that resolves with the site ID and the live deployment URL.
 */
export const deployToNetlify = async (
  htmlCode: string,
  apiToken: string,
  siteName: string
): Promise<NetlifyDeploymentResult> => {
  // 1. Create a zip file containing the index.html
  const zip = new JSZip();
  zip.file('index.html', htmlCode);
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  // 2. Create a new Netlify site
  const siteResponse = await fetch(`${NETLIFY_API_BASE}/sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      name: siteName,
    }),
  });

  const siteResult = await siteResponse.json();
  if (!siteResponse.ok) {
    throw new Error(siteResult.message || 'Failed to create Netlify site.');
  }

  const siteId = siteResult.id;

  // 3. Deploy the zip file to the new site
  const deployResponse = await fetch(`${NETLIFY_API_BASE}/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/zip',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: zipBuffer,
  });

  const deployResult = await deployResponse.json();
  if (!deployResponse.ok) {
    throw new Error(deployResult.message || 'Failed to deploy to Netlify.');
  }

  return {
    siteId: siteId,
    deploymentUrl: deployResult.ssl_url,
  };
};


/**
 * Redeploys an existing site to Netlify.
 *
 * @param htmlCode The raw HTML string to deploy.
 * @param apiToken The user's Netlify API token.
 * @param siteId The ID of the existing Netlify site.
 * @returns A promise that resolves with the site ID and the live deployment URL.
 */
export const redeployToNetlify = async (
    htmlCode: string,
    apiToken: string,
    siteId: string
    ): Promise<NetlifyDeploymentResult> => {
    // 1. Create a zip file containing the index.html
    const zip = new JSZip();
    zip.file('index.html', htmlCode);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 2. Deploy the zip file to the existing site
    const deployResponse = await fetch(`${NETLIFY_API_BASE}/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/zip',
            'Authorization': `Bearer ${apiToken}`,
        },
        body: zipBuffer,
    });

    const deployResult = await deployResponse.json();
    if (!deployResponse.ok) {
        throw new Error(deployResult.message || 'Failed to deploy to Netlify.');
    }

    return {
        siteId: siteId,
        deploymentUrl: deployResult.ssl_url,
    };
};
