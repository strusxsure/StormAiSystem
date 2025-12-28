import JSZip from 'jszip';

export interface NetlifyDeploymentResult {
  siteId: string;
  deploymentUrl: string;
}

export interface NetlifyFile {
  file: string;
  data: string;
}

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

const createZipFile = async (htmlCode: string): Promise<Blob> => {
  const zip = new JSZip();
  zip.file('index.html', htmlCode);
  return await zip.generateAsync({ type: 'blob' });
};

export const deployToNetlify = async (
  htmlCode: string,
  accessToken: string,
  projectName: string,
  existingSiteId?: string | null
): Promise<NetlifyDeploymentResult> => {
  let siteId = existingSiteId;

  if (!siteId) {
    const siteResponse = await fetch(`${NETLIFY_API_BASE}/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: projectName,
      }),
    });

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text();
      console.error("Netlify site creation failed:", errorText);
      let errorMessage = `Failed to create Netlify site: ${siteResponse.statusText} - ${errorText}`;
      try {
        const siteResult = JSON.parse(errorText);
        if (siteResult.errors?.subdomain?.[0]?.includes('must be unique')) {
          errorMessage = 'This project name is already taken. Please choose a different one.';
        } else if (siteResult.message) {
          errorMessage = `Failed to create Netlify site: ${siteResponse.statusText} - ${siteResult.message}`;
        }
      } catch (e) {
        // JSON parsing failed, use the raw error text
      }
      throw new Error(errorMessage);
    }
    const siteResult = await siteResponse.json();
    siteId = siteResult.id;
  }

  const zipFile = await createZipFile(htmlCode);

  const deploymentResponse = await fetch(`${NETLIFY_API_BASE}/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/zip',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: zipFile,
  });

  if (!deploymentResponse.ok) {
    const errorText = await deploymentResponse.text();
    console.error("Netlify deployment failed:", errorText);
    try {
        const deploymentResult = JSON.parse(errorText);
        throw new Error(`Failed to create Netlify deployment: ${deploymentResponse.statusText} - ${deploymentResult.message || errorText}`);
    } catch (e) {
        throw new Error(`Failed to create Netlify deployment: ${deploymentResponse.statusText} - ${errorText}`);
    }
  }

  const deploymentResult = await deploymentResponse.json();

  return {
    siteId: siteId!,
    deploymentUrl: deploymentResult.deploy_ssl_url,
  };
};
