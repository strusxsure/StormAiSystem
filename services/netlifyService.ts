import JSZip from 'jszip';
import { Buffer } from 'buffer';

export interface NetlifyDeploymentResult {
  siteId: string;
  deploymentUrl: string;
}

export interface NetlifyFile {
  file: string;
  data: string;
}

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

const createZipFile = async (htmlCode: string): Promise<Buffer> => {
  const zip = new JSZip();
  zip.file('index.html', htmlCode);
  return await zip.generateAsync({ type: 'nodebuffer' });
};

export const deployToNetlify = async (
  htmlCode: string,
  apiToken: string,
  projectName: string,
  existingSiteId?: string | null
): Promise<NetlifyDeploymentResult> => {
  let siteId = existingSiteId;

  if (!siteId) {
    const siteResponse = await fetch(`${NETLIFY_API_BASE}/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        name: projectName,
      }),
    });

    const siteResult = await siteResponse.json();
    if (!siteResponse.ok) {
      throw new Error(siteResult.message || 'Failed to create Netlify site.');
    }
    siteId = siteResult.id;
  }

  const zipFile = await createZipFile(htmlCode);

  const deploymentResponse = await fetch(`${NETLIFY_API_BASE}/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/zip',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: zipFile,
  });

  const deploymentResult = await deploymentResponse.json();

  if (!deploymentResponse.ok) {
    throw new Error(deploymentResult.message || 'Failed to create Netlify deployment.');
  }

  return {
    siteId: siteId!,
    deploymentUrl: `https://${deploymentResult.name}.netlify.app`,
  };
};
